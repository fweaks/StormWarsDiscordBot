module.exports = {
    name: 'getauthlink',
    description: 'Gets the authentication link for adding the bot to a server',
    usage: '',
    meta:true,
    hidden:true,
    admin: true,
    cooldown: 5,
  
    run : async (message, args, botClient) => {  
      botClient.generateInvite([117824])
          .then(link => console.log(`Generated bot invite link: ${link}`))
          .catch(console.error);
    }
}