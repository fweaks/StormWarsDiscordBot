const { WelcomeMessage } = require('../../strings.js');
const {Encode} = require('./encode.js');

module.exports = {
    name: 'welcome',
    aliases: ['hello'],
    description: 'welcomes new players',
    usage: '',
    hidden: true,
    cooldown: 5,
  
    run : async (message, args) => {
        //this is for an unknown other so don't mention the user
        let messageToSend = WelcomeMessage.replace(', ${member}', '');
      
        //link channels
        messageToSend = messageToSend.replace(/#[^#]+#/g, function (match) {
            const channelName = match.substr(1, match.length-2);
            const channel = message.guild.channels.find(ch => ch.name === channelName && ch.type === 'text');
            if (channel) {
                return channel.toString();
            } else {
                return '**'+channelName+'**';
            }
        }); 
      
        // Send the message, mentioning the member
        message.channel.send(Encode(messageToSend));
  }
}