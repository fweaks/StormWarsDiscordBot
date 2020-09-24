const { WelcomeMessage } = require('../strings.js')

module.exports = {
    trigger: 'guildMemberAdd',
  
    run : async (client, member) => {    
        // Send the message to a designated channel on a server:
        const generalChannel = member.guild.channels.find(ch => ch.name === 'general' && ch.type === 'text');
        const devChannel = member.guild.channels.find(ch => ch.name === 'dev-chat');

        // Do nothing if the channel wasn't found on this server
        if (!generalChannel) { return; }

        //prepare the message (mention the user, link the dev chat, etc.)
        let messageToSend = WelcomeMessage.replace('${member}', member);
        if (devChannel) {
            messageToSend = messageToSend.replace('${channel}', devChannel.toString());
        } else {
            messageToSend = messageToSend.replace('${channel}', generalChannel.toString());
        }

        // Send the message
        setTimeout(function() {generalChannel.send(messageToSend)},300);
        //generalChannel.send(messageToSend);
      
        // Temporary
        setTimeout(function() {generalChannel.send('***BTW' + member + ': This is NOT a Fortnite Server.***')},2300);
      
    }
}