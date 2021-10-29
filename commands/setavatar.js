module.exports = {
    name: 'setavatar',
    description: "Set's the display picture for the bot",
    usage: '<imageURL>',
    meta:true,
    hidden:true,
    admin: true,
    cooldown: 5,
  
    run : async (message, args, botClient) => {
        botClient.user.setAvatar(args[0])
        .then(() => { 
            message.channel.send('Successfully updated my avatar'); 
        })
        .catch(error => {
            message.channel.send('Failed to update my avatar. See the log for more details');
            console.log(error);
        })
    }
}



