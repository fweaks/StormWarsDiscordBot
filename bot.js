const Discord = require('discord.js');
const fs = require("fs");
const express = require('express');
const oAuthCallbackHandler = require('./commands/update.js');
const DraftSetup = require('./draft/DraftSetup.js');

const discord_token = process.env.DISCORD_BOT_TOKEN;
const prefix = process.env.PREFIX;

// Create an instance of a Discord client
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

let botReady = false;
let logUser = undefined;
client.on('error', error => console.log(`[ERROR] ${error}`));
client.on('warning', warning => console.log(`[WARNING] ${warning}`));
client.on('debug', debug => {
    if(botReady === true){return;}
    if(debug.includes('Sending a heartbeat')){return;}
    if(debug.includes('Heartbeat acknowledged')){return;}
    console.log(`[DEBUG] ${debug}`);
});
client.on('ready', async (...args) => {
    botReady = true;
    
    logUser = await client.users.fetch("430996790884564992").catch(console.log);
    if (!logUser) { return console.log("User Not found"); }
    //await logUser.send("I'm awake").catch(console.log);
});

//This loop reads the /commands/ folder and maps the commands for later execution
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    try{
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    } catch(err) {
        console.log(`Error while reading command ${file}`, err);
    }
}
console.log('Finished Parsing Commands');

// This loop reads the /events/ folder and attaches each event file to the appropriate event.
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    try{
        const event = require(`./events/${file}`);
        // super-secret recipe to call events with all their proper arguments *after* the `client` var.
        client.on(event.trigger, (...args) => event.run(client, ...args));
    } catch(err) {
        console.log(`Error while reading event ${file}`, err);
    }
}
console.log('Finished Parsing Events');


// Create an event listener for messages
client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    //console.log(`Command Received from ${message.author.name} in channel ${message.channel.name}: ${message.content}`);
    logMessage = `${new Date().toISOString()} - ${message.author.username}${message.author}@${message.channel.type === 'dm' ? 'DM' : message.channel.name}@${message.channel.type === 'dm' ? 'DM' : message.guild.name}: ${message.content}`; 
    console.log(logMessage);                
    if(logUser){logUser.send(logMessage).catch(console.log);}

    //strip characters that aren't allowed, e.g. @ for mentions
  
    let args = message.content.slice(prefix.length).split(/ +/);    
  
    // Find the Command
    const commandName = args.shift().toLowerCase();
    if (commandName.includes('wombat') || (message.author.username.includes('wombat'))) { return message.channel.send('We don\'t serve your kind here'); }
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) {
        return message.channel.send('I don\'t understand that command. Please type !help for more options.');
    }

    //sanitise unless explictly told not to
    if(command.rawArgs === undefined || command.rawArgs !== true){
        args = message.content.replace(/[@#]+/g,'').slice(prefix.length).split(/ +/);
        args.shift();
    }

    // Check GuildOnly
    if (command.guildOnly && message.channel.type !== 'text') {
        return message.reply('I can\'t execute that command inside DMs!');
    }
    // Check Permission
    if(command.admin && !(message.member && message.member.hasPermission("MANAGE_GUILD"))){
        return message.channel.send(`You don\'t have permission for that command ${message.author}!`);
    }

    // Check proper usage
    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(reply);
    }   

    // Check cooldown
    if(command.cooldown){
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (!timestamps.has(message.author.id)) {
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        }
        else {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        }
    }

    //Finally execute the command
    try {
        if(command.meta === true){
            setTimeout(function() {command.run(message, args, client)},300); //300ms timeout before command execution. So message appears below what it is responding to
        }else{
            setTimeout(function() {command.run(message, args)},300); //300ms timeout before command execution. So message appears below what it is responding to
        }
    }
    catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
    return;
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(discord_token);

//Implement an http server and expose several routes
var app = express();
//so uptimerobot can keep the bot awake:
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});
//for google to review for the oAuth2 Stuff
app.get('/Privacy', function(request, response) {
  response.sendFile(__dirname + '/views/privacy.html');
});
//for google to send the authorisation code back to
app.get('/oauth2callback', oAuthCallbackHandler.AuthorisationCallback);
//setup all the draft stuff
DraftSetup(app);

var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});