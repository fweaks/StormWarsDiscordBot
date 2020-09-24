const child_process = require('child_process');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { GOOGLE_TOKEN_PATH, CARD_ALIAS_PATH, EQUIP_ALIAS_PATH, SKILL_ALIAS_PATH, CARD_SEARCH_PATH } = require('../strings.js');

let tokenSet = false;   

const usage = '<starttoken|finishtoken <code>|cards|equips|skills|search>'
module.exports = {
    name: 'update',
    description: 'Updates different types of data from the google spreadsheet',
    usage: usage,
    args: true,
    hidden: true,
    admin: true,
  
    run : async (message, args) => {
        if (args[0] === 'starttoken') {          
            StartTokenProcess(message)
        }
        else if(args[0] === 'finishtoken') {
            GetAndSaveToken(args[1], message);
        }
        else if(['cards', 'card'].includes(args[0])) {
            UpdateJSONData('Cards!A1:C', CARD_ALIAS_PATH, 'cards', message);
        }
        else if(['equips', 'equip'].includes(args[0])) {
            UpdateJSONData('equips!A1:C', EQUIP_ALIAS_PATH, 'equips', message);
        }
        else if(['skills', 'skill'].includes(args[0])) {
            UpdateJSONData('skills!A1:C', SKILL_ALIAS_PATH, 'skills', message);
        }
        else if(args[0] === 'search') {
            UpdateJSONData('traits!A1:J', CARD_SEARCH_PATH, 'search', message);
        } else {
            message.reply(`I didn't recognise the update type: "${args[0]}"`);
            message.reply(`Valid usage is: \`!update <${usage}>\``);
        }
    } 
}

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob"/*redirect uri*/
);

fs.readFile(GOOGLE_TOKEN_PATH, (err, token) => {
    if (err) {
        console.log('there is no token');
    } else {      
        try {
            oAuth2Client.setCredentials(JSON.parse(token));
            tokenSet = true;
        } catch(err) {
            console.log('The token is invalid');
        }
    }       
});

google.options({
  auth: oAuth2Client
});

const sheets = google.sheets({version: 'v4', oAuth2Client});

function StartTokenProcess(message){
    fs.readFile(GOOGLE_TOKEN_PATH, (err, token) => {
        if(!err) {
            message.reply('NOTE: you already have a token. Continue if you want to create a new one');
        }
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });      
        message.reply('Authorize this app by visiting this url:' + authUrl);
        message.reply('Follow the instructions, then give me back the code they give you with `!update finishtoken <code>`');
    });
}

function GetAndSaveToken(code, message) {
    if (code === undefined) {
        return message.reply('You need to provide the code you get from following the instructions in `!update starttoken`');
    }
    oAuth2Client.getToken(code, (err, token) => {
        if (err) {
            return message.reply('Error while trying to retrieve access token', err);
        }
        oAuth2Client.setCredentials(token);
        tokenSet = true;
        // Store the token to disk for later program executions
        fs.writeFile(GOOGLE_TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) {
                console.error(err);
            }
            child_process.exec('refresh');
            return message.reply('Token stored successfully');
        });
    });
}

function UpdateJSONData(range, path, type, message) {
    if(!tokenSet){
        return message.reply('You need to get a token first. Use `!update starttoken` to begin');
    }  
    message.reply('This might take a while, please wait...');
    PullSpreadsheetDataAsObject(range)
        .then(data => {
            WriteJSONWithBackups(path, data)
        }).then(() => {
            message.reply(`Successfully updated ${type}!`);
    }).catch(err => {
        console.log(err);
        message.reply(`Failed to update ${type}! See logs for more details.`);
    });
}

function PullSpreadsheetDataAsObject(range){
    return new Promise((Resolve, Reject) => {
        sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: range,
            valueRenderOption: "UNFORMATTED_VALUE"
        }).then( responseData => {
            const rows = responseData.data.values;
            if (rows.length > 2) {
                const headers = rows.shift();
                const data = []

                rows.map((row) => {
                    const card = {};
                    for (let i = 0; i < headers.length; i++) {
                        card[headers[i]] = row[i];
                    }
                    data.push(card);
                });
                Resolve(data);
            } else {
                Reject('No data found.');
            }
        }).catch( err => {
            Reject('The API returned an error: ' + err);
        });
    });
}

function WriteJSONWithBackups(path, data){
    return new Promise( (Resolve, Reject) => {
        //JSONify and pretty print
        let JSONData = JSON.stringify(data)
                           .replace(/,"/g,',\n\t\t"')
                           .replace(/}/g,'\n\t}')
                           .replace(/{/g,'\n\t{\n\t\t');
        
        child_process.exec(`cp ${path} backup/${path}.before`);
        fs.writeFile(path, JSONData, (err) => {
            if (err) {
                console.error(`Error while saving to${path}`, err);
                Reject(err);
                return;
            }
            child_process.exec(`cp ${path} backup/${path}.after`);            
            child_process.exec('refresh');
            Resolve();
        });
    });
}