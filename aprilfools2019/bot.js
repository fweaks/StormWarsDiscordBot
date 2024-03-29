var morse = require('./MorseCode.js');
const Discord = require('discord.js');
const fs = require("fs");
const child_process = require('child_process');
var express = require('express');

const discord_token = process.env.DISCORD_BOT_TOKEN;
const prefix = process.env.PREFIX;
const { WelcomeMessage, HelpMessage } = require('../strings.js');

// Create an instance of a Discord client
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

//This loop reads the /commands/ folder and maps the commands for later execution
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    try{
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    } catch(err) {
        try{
            const command = require(`../commands/${file}`);
            client.commands.set(command.name, command);
        }catch(err){
            console.log(`Error while reading command ${file}`, err);
        }
    } 
}

// This loop reads the /events/ folder and attaches each event file to the appropriate event.
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    try{
        const event = require(`../events/${file}`);
        // super-secret recipe to call events with all their proper arguments *after* the `client` var.
        client.on(event.trigger, (...args) => event.run(client, ...args));
    } catch(err) {
        console.log(`Error while reading event ${file}`, err);
    }
}


// Create an event listener for messages
client.on('message', message => {
    if (!(message.content.startsWith(prefix) || message.content.startsWith(morse.encode(prefix))) || message.author.bot) return;
    var messageString = message.content;
    if(messageString.startsWith(prefix)){
        messageString = morse.encode(prefix) + messageString.slice(prefix.length);
    }
    messageString = messageString.replace(/\//g,' / ')
    //strip characters that aren't allowed, e.g. not morse code 
    const sanitisedMessage = morse.decode(messageString);
  
    const args = sanitisedMessage.slice(prefix.length).split(/ +/);    
  
    // Find the Command
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) {
        return message.channel.send(morse.encode('I don\'t understand that command. Please type !help for more options.'));
    }

    // Check GuildOnly
    if (command.guildOnly && message.channel.type !== 'text') {
        return message.reply('I can\'t execute that command inside DMs!');
    }
    // Check Permission
    if(command.admin && !message.member.hasPermission("MANAGE_GUILD")){
        return message.channel.send(`You don\'t have permission for that command ${message.author}!`);
    }

    // Check proper usage
    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(morse.encode(reply));
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
            setTimeout(function() {command.run(message, args, client)},300); //300ms timeout before command execution. So message appear below
        }else{
            setTimeout(function() {command.run(message, args)},300); //300ms timeout before command execution. So message appear below
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

//Implement an http server and expose a route so that uptimerobot.com can keep the bot alive
var app = express();
//app.use(express.static('public'));
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});