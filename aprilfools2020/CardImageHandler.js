const MergeImages = require("merge-images");
const { Canvas, Image } = require('canvas');
const Discord = require('discord.js');

//pre-prepare the mapping of names and aliases to "card images"
const aliases = require('./CardImageAlias.json');
const aliasMap = new Discord.Collection();
for (let aliasObject of aliases) {
    const URLCardName = aliasObject.CARDNAME.toLowerCase().replace(/ +/g,'_');  
    aliasMap.set(URLCardName, aliasObject.IMAGES);
}

module.exports = {  
    GetBase64URIImage: function(URLCardName){
        //setup arguments for merge, with each image offset in x
        const imageSources = aliasMap.get(URLCardName);
        const imageArguments = [];
        for(let i = 0; i < imageSources.length; i++){
            imageArguments[i] = { src: 'https://cdn.glitch.com/55f9b5c0-3635-411a-a547-28ff8cdddb61%2F' + imageSources[i], x: i * 691, y: 0 };
        }      
        
        return MergeImages(imageArguments, {
            width: 691 * imageArguments.length,
            height: 1056,
            Canvas: Canvas,
            Image: Image
        });
    },
      
    GetImageAttachment: function(URLCardName){
        return new Promise((Resolve, Reject) => {      
            this.GetBase64URIImage(URLCardName)      
                .then(b64URI => {
                    const imageStream = new Buffer(b64URI.split("base64,")[1], 'base64');
                    Resolve(new Discord.Attachment(imageStream));
                })
                .catch(error => { Reject(console.log("something went wrong composing the image" + error)); });
        });
    },
  
    run : async (message, args) => {
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
    }
}