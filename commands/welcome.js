const { WelcomeMessage } = require('../strings.js')

module.exports = {
    name: 'welcome',
    aliases: ['hello'],
    description: 'welcomes new players',
    usage: '',
    hidden: true,
    cooldown: 5,
  
    run : async (message, args) => {
        // Send the message to a designated channel on a server:
        const devChannel = message.guild.channels.find(ch => ch.name === 'dev-chat');

        let messageToSend = WelcomeMessage.replace(', ${member}', '');
        if (devChannel) {
            messageToSend = messageToSend.replace('${channel}', devChannel.toString());
        } else {
            messageToSend = messageToSend.replace('${channel}', message.channel.toString());
        }
        // Send the message, mentioning the member
        message.channel.send(messageToSend);
  }
}