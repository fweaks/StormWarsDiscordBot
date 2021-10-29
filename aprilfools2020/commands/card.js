const Discord = require('discord.js');
const {CARD_IMAGE_URL} = require('../../strings.js');
const {Encode} = require('./encode.js');

//pre-prepare the mapping of names and aliases to canonical card names
const aliases = require('../../CardAlias.json');
const aliasMap = new Discord.Collection();
for (let aliasObject of aliases) {
    const URLCardName = aliasObject.Cardname.replace(/ +/g,'_');  
    aliasMap.set(aliasObject.Keyword.replace(/ +/g,'').toLowerCase(), URLCardName);  
    for (let alias of (aliasObject.Alias || "").replace(/ +/g,'').toLowerCase().split(';')) {    
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
            var cardImageURL = CARD_IMAGE_URL.replace('${URLCardName}', URLCardName);
            const attachment = new Discord.Attachment(cardImageURL);
            message.channel.send(attachment)
                .catch(err => { console.log(`"${URLCardName}" was requested which exists but has no image @ ${cardImageURL}`); });
        } else {
            message.channel.send(Encode(`Card name "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`));
        }
    }
}