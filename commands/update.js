const child_process = require('child_process');
const Database = require("@replit/database");
const DbEx = require('../common/DbExtensions.js');
const fs = require('fs');
const { google } = require('googleapis');
const url = require('url');
const { CARD_ALIAS_PATH, SKILL_ALIAS_PATH, CARD_SEARCH_PATH, HISTORY_PATH } = require('../strings.js'); 
const {ReparseCards} = require('./card.js');
const {ReparseSkills} = require('./skill.js');
const {ReparseSearch} = require('./search.js');
//const {ReparseHistory} = require('./history.js');

module.exports = {
    name: 'update',
    description: 'Updates different types of data from the google spreadsheet',
    usage: '<starttoken|finishtoken <code>|starttokenauto|cards|equips|skills|search|history>',
    args: true,
    hidden: true,
    admin: true,
  
    run : async (message, args) => {
        let promise = null;
        switch (args[0]) {
            case 'starttoken':
                StartTokenProcessManual(message)
                break;
            case 'starttokenauto':
                StartTokenProcessAuto(message);
                break;
            case 'finishtoken':
                GetAndSaveTokenManual(args[1], message);
                break;
            case 'cards':
            case 'card':
                promise = Promise.resolve(console.log("promise start"))
                .then(() => UpdateJSONData('Cards!A1:C', CARD_ALIAS_PATH, 'cards', message))
                .then(() => ReparseCards(true));
                break;
            case 'skills':
            case 'skill':
            case 'ability':
            case 'abilities':
                promise = Promise.resolve(console.log("promise start"))
                .then(() => UpdateJSONData('Abilities!A1:B', SKILL_ALIAS_PATH, 'skills', message))
                .then(() => ReparseSkills(true));
                break;
            case 'search':
                promise = Promise.resolve(console.log("promise start"))
                .then(() => UpdateJSONData('Traits!A1:I', CARD_SEARCH_PATH, 'search', message))
                .then(() => ReparseSearch(true));
                break;
            /*case 'history':
                promise = Promise.resolve(console.log("promise start"))
                .then(() => UpdateJSONData('history!A1:D', HISTORY_PATH, 'history', message))
                .then(() => ReparseHistory(true));
                break;*/
            default:
                message.reply(`I didn't recognise the update type: "${args[0]}"`);
                message.reply(`Valid usage is: \`!update <${this.usage}>\``);
                break;
        }

        if(promise){
            await promise
            .catch(console.log);
        }
    },

    AuthorisationCallback: GetAndSaveTokenAuto
}

let tokenSet = false;
const db = new Database();
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob"/*redirect uri*/
);

db.get("googleapis_token")
.then(token => {
    if(token){      
        try {
            oAuth2Client.setCredentials(token);
            tokenSet = true;
        } catch(err) {
            console.log('The token is invalid');
        }
    }else{
        console.log('there is no token');
    }
})
.catch(error => { console.log(`failed to get token from database: ${error}`) });

google.options({ auth: oAuth2Client });
const sheets = google.sheets({version: 'v4', oAuth2Client});

function GiveCommonTokenProcessInstructions(message){
    db.get("googleapis_token")
    .then(value => {
        if(value){
            message.reply('NOTE: you already have a token. Continue if you want to create a new one');
        }
    })
    .catch(error => console.log("Failed reading token from database"));

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });      
    message.reply('Authorize this app by visiting this url:' + authUrl);
}

function StartTokenProcessManual(message){    
    GiveCommonTokenProcessInstructions(message);
    message.reply('Follow the instructions, then give me back the code they give you with `!update finishtoken <code>`');
}

function GetAndSaveToken(code, message){
    oAuth2Client.getToken(code, (err, token) => {
        if (err) {
            console.log(`Failed to retrieve access token: ${err}`)
            return message.reply('Failed to retrieve access token, see log for more details');
        }
        oAuth2Client.setCredentials(token);
        tokenSet = true;

        // Store the token to database for later program executions        
        db.set("googleapis_token", token)
        .then(()=>{ return message.reply('Token stored successfully'); })
        .catch(error => { 
          message.reply('Failed to store token, see log for more details');
          console.log(`Failed to store token: ${error}`) 
        });
    });
}
function GetAndSaveTokenManual(code, message) {
   if (!code) {
        return message.reply('You need to provide the code you get from following the instructions in `!update starttoken`');
    }
    GetAndSaveToken(code, message);
}

let startMessage = null;
function StartTokenProcessAuto(message){
    GiveCommonTokenProcessInstructions(message);
    message.reply("Follow the instructions, then I'll let you know if it worked");
    startMessage = message;
    setTimeout(function() {
        if(startMessage){
            message.reply("Authorisation request timed out, please start again");
            startMessage = null;
        }
    },300000/*5 minutes*/);
}

function GetAndSaveTokenAuto(request, response){
    if(!startMessage){
        return console.log("Unexpected oAuth Callback");
    }
    console.log(request);
    console.log(response);
    const searchParams = new url.URL(request.url, 'http://localhost:3000').searchParams;
    const code = searchParams.get('code');
    console.log(`Code is ${code}`);
    if(!code){
      return startMessage.reply("Invalid Code received from authentication")
    }
    res.end('Authentication response received!');

    startMessage.reply("Authorisation response received, requesting Token...")
    GetAndSaveToken(code, startMessage);
    startMessage = null;
}

function UpdateJSONData(range, path, type, message) {
    if(!tokenSet){
        console.log("No Token Available");
        return message.reply('You need to get a token first. Use `!update starttoken` to begin');
    }  
    return Promise.resolve(console.log("UpdateJSONData"))
    .then(message.reply('This might take a while, please wait...'))
    .catch(console.log)
    .then(() => PullSpreadsheetDataAsObject(range))
    .catch(error => {
            return message.reply(`Failed to update ${type}! See logs for more details.`)
            .catch(()=>{})
            .then(() => Promise.reject(`Failed to pull data: ${error}`));
        })
    .then(data => SaveJSONData(path, data))
    .then(() => message.reply(`Successfully updated ${type}!`))
    .catch(error => {
        return message.reply(`Failed to update ${type}! See logs for more details.`)
        .catch(()=>{})
        .then(() => console.log(error))
        .then(() => Promise.reject(error));
    });
}

function PullSpreadsheetDataAsObject(range){
    return Promise.resolve(console.log("PullSpreadsheetDataAsObject"))
    .then(() => sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: range,
            valueRenderOption: "UNFORMATTED_VALUE"
    }))
    .then(responseData => {
        if(responseData === undefined){return Promise.reject("responseData is undefined");}
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
            
            return data;
        } else {
            return Promise.reject('No data found.');
        }
    })
    .catch((error) => Promise.reject('Failed to PullSpreadsheetDataAsObject: ' + error));
}

function SaveJSONData(path, data){
    return Promise.resolve(console.log("SaveJSONData"))
    .then(() => DbEx.SetLargeObject(path, data, true))
    .then(() => WriteJSONWithBackups(path, data))
}

function WriteJSONWithBackups(path, data){
    return new Promise((Resolve, Reject) => {
        console.log("WriteJSONWithBackups");
        if (data === undefined) { return Reject(`data is undefined `); }
        //JSONify and pretty print
        let JSONData = JSON.stringify(data)
                           .replace(/,"/g,',\n\t\t"')
                           .replace(/}/g,'\n\t}')
                           .replace(/{/g,'\n\t{\n\t\t');
        
        child_process.exec(`cp ${path} backup/${path}.before`, (error, stdout, stderr) => {
            if(error) { return Reject({error,stdout, stderr}); }
            
            fs.writeFile(path, JSONData, (err) => {
                if (err) {
                    console.error(`Error while saving to${path}`, err);
                    return Reject(err);
                }
                child_process.exec(`cp ${path} backup/${path}.after`);            
                child_process.exec('refresh');
                return Resolve();
            });
        });
    })
    .catch((error) => Promise.reject(`Failed to WriteJSONWithBackups: ${error}`));
}