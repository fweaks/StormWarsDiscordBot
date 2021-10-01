const { WelcomeMessage } = require('../strings.js')

module.exports = {
    name: 'welcome',
    aliases: ['hello'],
    description: 'welcomes new players',
    usage: '',
    hidden: true,
    cooldown: 5,
  
    run : async (message, args) => {
        let messageToSend = WelcomeMessage.replace(', ${member}', '');

        // Make the message point to the dev channel if it exists:
        if(message.guild){
            const devChannel = message.guild.channels.cache.find(ch => ch.name === 'dev-chat');
            if (devChannel) {
                messageToSend = messageToSend.replace('${channel}', devChannel.toString());
            } else {
                messageToSend = messageToSend.replace('${channel}', message.channel.toString());
            }
        } else {
            messageToSend = messageToSend.replace('on the ${channel} channel', 'in the dev-chat channel in the official Storm Wars discord server');
        }
        // Send the message, mentioning the member
        message.channel.send(messageToSend);
  }
}