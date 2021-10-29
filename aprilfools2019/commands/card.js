const Discord = require('discord.js');
//const {CARD_IMAGE_URL} = require('../strings.js');

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

const MTGCastles = ['https://api.scryfall.com/cards/multiverse/11195?format=image',
                    'https://api.scryfall.com/cards/multiverse/113614?format=image',
                    'https://api.scryfall.com/cards/multiverse/3037?format=image',
                    'https://api.scryfall.com/cards/multiverse/79205?format=image',
                    'https://api.scryfall.com/cards/multiverse/430469?format=image',
                    'https://img.scryfall.com/cards/large/front/7/f/7f910495-8bd7-4134-a281-c16fd666d5cc.jpg?1572491161',
                    'https://img.scryfall.com/cards/large/front/8/b/8bb8512e-6913-4be6-8828-24cfcbec042e.jpg?1572491168',
                    'https://img.scryfall.com/cards/large/front/e/3/e3c2c66c-f7f0-41d5-a805-a129aeaf1b75.jpg?1572491176',
                    'https://img.scryfall.com/cards/large/front/0/a/0a8b9d37-e89c-44ad-bd1b-51cb06ec3e0b.jpg?1572491190',
                    'https://img.scryfall.com/cards/large/front/1/9/195383c1-4723-40b0-ba53-298dfd8e30d0.jpg?1572491183'
                   ]

module.exports = {  
    name: 'card',
    aliases: ['cards'],
    description: 'Displays the named card',
    usage: 'CARD NAME',
    args: true,
  
    run : async (message, args) => {
        const index = Math.floor(Math.random()*5);
        const attachment = new Discord.Attachment(MTGCastles[index],'castle.png');
        message.channel.send(attachment);
        return;
      
        /*const cardNameArg = args.join('').toLowerCase();

        const URLCardName = aliasMap.get(cardNameArg);
        if (URLCardName !== undefined) {
            var cardImageURL = CARD_IMAGE_URL.replace('${URLCardName}', URLCardName);
            const attachment = new Discord.Attachment(cardImageURL);
            message.channel.send(attachment)
                .catch(err => { console.log(`"${URLCardName}" was requested which exists but has no image @ ${cardImageURL}`); });
        } else {
            message.channel.send(`Card name "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`);
        }*/
    }
}