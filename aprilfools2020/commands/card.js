//this is just a backup because i didn't do it properly
const Discord = require('discord.js');
const ImageHandler = require('../aprilfools2020/CardImageHandler.js');

//pre-prepare the mapping of names and aliases to canonical card names
const aliases = require('../CardAlias.json');
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
    usage: '<CARD NAME>',
    args: true,
  
    run : async (message, args) => {
        const cardNameArg = args.join('').toLowerCase();

        const URLCardName = aliasMap.get(cardNameArg);
        if (URLCardName !== undefined) {
          ImageHandler.GetImageAttachment(URLCardName)
                      .then(attachment => {
                          message.channel.send(attachment)
                                         .catch(err => { console.log(err); });
                      })
                      .catch(err => { console.log(err); });
        } else {
            message.channel.send(`Card name "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`);
        }
    }
}