const request = require("request").defaults({ "encoding" : null });

module.exports = {
    name: 'setavatar',
    description: "Set's the display picture for the bot in your server",
    usage: '',
    meta:true,
    hidden:true,
    admin: true,
    cooldown: 5,
  
    run : async (message, args, botClient) => {
        request(args[0], function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString("base64");
                botClient.user.setAvatar(data, ()=>{message.channel.send('Successfully update my avatar');});
            }else{
                message.channel.send('Failed to update my avatar');
                console.log(error);
            }
        });
    }
}



