const Discord = require('discord.js');

module.exports = {        
    GetImageAttachment: function(URLCardName){
        return new Promise((Resolve, Reject) => { 
            var cardImageURL = `https://d3f7do5p5ldf15.cloudfront.net/Discord/cards/${URLCardName}.png`;
            Resolve(new Discord.Attachment(cardImageURL));
        });
    }//,
  
    /*run : async (message, args) => {
        const cardNameArg = args.join('').toLowerCase();

        const URLCardName = aliasMap.get(cardNameArg);
        if (URLCardName !== undefined) {
            var cardImageURL = `http://downloads.stormwarsgame.com/cards/${URLCardName}.png`;
            const attachment = new Discord.Attachment(cardImageURL);
            message.channel.send(attachment)
                .catch(err => { console.log(`"${URLCardName}" was requested which exists but has no image`); });
        } else {
            message.channel.send(`Card name "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`);
        }
    }*/
}