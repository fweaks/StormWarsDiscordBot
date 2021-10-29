const { WelcomeMessage } = require('../strings.js')

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

        // Make the message point to the dev channel if it exists:
        if(message.guild){
            messageToSend = messageToSend.replace(/#[^#]+#/g, function (match) {
                const channelName = match.substr(1, match.length-2);
                const channel = message.guild.channels.cache.find(ch => ch.name === channelName && ch.type === 'text');
                if (channel) {
                    return channel.toString();
                } else {
                    return '**'+channelName+'**';
                }
            }); 
        } else {
            messageToSend = messageToSend.replace(/#[^#]+#/g, function (match) {
                return '**'+channelName+'**';
            });
        }

        message.channel.send(messageToSend);
  }
}