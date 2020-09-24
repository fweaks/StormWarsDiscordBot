var morse = require('../MorseCode.js');
const Discord = require('discord.js');

//pre-prepare the mapping of names and aliases to canonical card names
const aliases = require('../../CardAlias.json');
const aliasMap = new Discord.Collection();
for (let aliasObject of aliases) {
    const URLCardName = aliasObject.CARDNAME.toLowerCase().replace(/ +/g,'_');  
    aliasMap.set(aliasObject.KEYWORD.replace(/ +/g,'').toLowerCase(), URLCardName);  
    for (let alias of (aliasObject.ALIAS || "").replace(/ +/g,'').toLowerCase().split(';')) {    
        aliasMap.set(alias, URLCardName);
    }
}

module.exports = {  
    name: 'card',
    aliases: ['cards'],
    description: 'Displays the named card',
    usage: 'CARD NAME',
    args: true,
  
    run : async (message, args) => {
        const cardNameArg = args.join('').toLowerCase();

        const URLCardName = aliasMap.get(cardNameArg);
        if (URLCardName !== undefined) {
            //var cardImageURL = `http://downloads.stormwarsgame.com/cards/${URLCardName}.png`;
            //var cardImageURL = `https://d2mfjkuqgad2g.cloudfront.net/cards/${URLCardName}.png`;
            var cardImageURL = `https://d3f7do5p5ldf15.cloudfront.net/Discord/cards/${URLCardName}.png`;
            const attachment = new Discord.Attachment(cardImageURL);
            message.channel.send(attachment)
                .catch(err => { console.log(`"${URLCardName}" was requested which exists but has no image`); });
        } else {
            message.channel.send(morse.encode(`Card name "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`));
        }
    }
}