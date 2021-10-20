const Discord = require('discord.js');
const ImageHandler = require('../common/CardImageHandler.js');
const DbEx = require('../common/DbExtensions.js');
const { CARD_ALIAS_PATH } = require('../strings.js'); 

//pre-prepare the mapping of names and aliases to canonical card names
let cardAliasMap;
let cardFlavourMap;
reparse();

module.exports = {  
    name: 'card',
    aliases: ['cards', 'flavour', 'flavor'],
    description: 'Displays the named card',
    usage: '<CARD NAME>',
    args: true,
  
    run : async (message, args) => {
        const cardNameArg = args.join('').toLowerCase();
        const URLCardName = cardAliasMap.get(cardNameArg);
        if (URLCardName !== undefined) {
            if(message.content.startsWith('!flavo')){
                message.channel.send(cardFlavourMap.get(URLCardName));
            } else {
                ImageHandler.GetImageAttachment(URLCardName)
                .then(attachment => {
                    message.channel.send(attachment)
                        .catch(err => { console.log(err); });
                })
                .catch(err => { 
                    console.log(err);
                    message.channel.send("I know that card exists, but I couldn't find an image for it sorry.")
                        .catch(err => { console.log(err); });
                });
            }
        } else {
            message.channel.send(`Card name "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`);
        }        
    },

    ReparseCards : reparse
}

function reparse(debug = false) {
    return Promise.resolve(console.log("reparse cards"))
    .then(() => DbEx.GetLargeObject(CARD_ALIAS_PATH, debug))
    .then((cardData) => {
        console.log("rebuilding cards");
    
        cardAliasMap = new Discord.Collection();
        cardFlavourMap = new Discord.Collection();

        for (let card of cardData) {
            const URLCardName = card.CARDNAME.replace(/ +/g,'_').toLowerCase();
            const preparedCardName = card.CARDNAME.replace(/ +/g,'').toLowerCase();
            cardAliasMap.set(preparedCardName, URLCardName); 
            if(preparedCardName.includes('legendary')){
                cardAliasMap.set(preparedCardName.replace('legendary', 'l'), URLCardName); 
            }
            if(card.ALIAS){
                for (let alias of card.ALIAS.replace(/ +/g,'').toLowerCase().split(';')) {    
                    cardAliasMap.set(alias, URLCardName);
                }
            }

            cardFlavourMap.set(URLCardName, card.FLAVOR);
        } 
        console.log("finished cards");
    })
    .catch(console.log); 
};