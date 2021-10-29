const Discord = require('discord.js');
const {Encode} = require('./encode.js');

//pre-prepare the mapping of names and aliases to canonical card names
const { ABILITY_ALIAS_PATH } = require('../../strings.js');
const aliases = require('../../' + ABILITY_ALIAS_PATH);
const aliasMap = new Discord.Collection();
const descriptionMap = new Discord.Collection();
for (let aliasObject of aliases) {
    descriptionMap.set(aliasObject.Ability, aliasObject.Description);
    aliasMap.set(aliasObject.Ability.replace(/ +/g,'').toLowerCase(), aliasObject.Ability);  
    for (let alias of (aliasObject.Alias || "").replace(/ +/g,'').toLowerCase().split(';')) {    
        aliasMap.set(alias, aliasObject.Ability);
    }
}


module.exports = {  
    name: 'ability',
    aliases: ['ability','skills', 'skill', 'abilities'],
    description: 'Displays the ability description',
    usage: 'ability NAME',
    args: true,
  
    run : async (message, args) => {
        const abilityNameArg = args.join('').toLowerCase();
        
        const AbilityName = aliasMap.get(abilityNameArg);
        if (AbilityName !== undefined) {
            const AbilityDescription = descriptionMap.get(AbilityName);
            if (AbilityDescription !== undefined) {
                message.channel.send(Encode(`------- Ability: ${AbilityName} -------`)+'\n' +
                                      Encode(AbilityDescription))
                    .catch(err => { console.log(`failed to send message for ${abilityNameArg}`); });
            } else {
                console.log(`"${AbilityName}" was requested which exists but has no description`);
            }
        
            //var cardImageURL = `http://downloads.stormwarsgame.com/cards/${URLCardName}.png`;
            //const attachment = new Discord.Attachment(cardImageURL);
            //message.channel.send(attachment)
            //    .catch(err => { console.log(`"${URLCardName}" was requested which exists but has no image`); });
        } else {
            message.channel.send(Encode(`Ability "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`));
        }
        
    }
}