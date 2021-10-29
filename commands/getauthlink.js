const REQUESTED_PERMISSIONS = 117824;

module.exports = {
    name: 'getauthlink',
    description: 'Gets the authentication link for adding the bot to a server',
    usage: '',
    meta:true,
    hidden:true,
    admin: true,
    cooldown: 5,
  
    run : async (message, args, botClient) => {  
      botClient.generateInvite([REQUESTED_PERMISSIONS])
          .then(link => console.log(`Generated bot invite link: ${link}`))
          .catch(console.error);
    }
}