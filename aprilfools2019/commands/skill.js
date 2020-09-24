var morse = require('../MorseCode.js');
const Discord = require('discord.js');

//pre-prepare the mapping of names and aliases to canonical card names
const aliases = require('../../SkillAlias.json');
const aliasMap = new Discord.Collection();
const descriptionMap = new Discord.Collection();
for (let aliasObject of aliases) {
    descriptionMap.set(aliasObject.SKILLNAME, aliasObject.SKILLDESCRIPTION);
    aliasMap.set(aliasObject.SKILLNAME.replace(/ +/g,'').toLowerCase(), aliasObject.SKILLNAME);  
    for (let alias of (aliasObject.ALIAS || "").replace(/ +/g,'').toLowerCase().split(';')) {    
        aliasMap.set(alias, aliasObject.SKILLNAME);
    }
}


module.exports = {  
    name: 'skill',
    aliases: ['ability','skills', 'abilities'],
    description: 'Displays the skill description',
    usage: 'SKILL NAME',
    args: true,
  
    run : async (message, args) => {
        const skillNameArg = args.join('').toLowerCase();
        
        const SkillName = aliasMap.get(skillNameArg);
        if (SkillName !== undefined) {
            const SkillDescription = descriptionMap.get(SkillName);
            if (SkillDescription !== undefined) {
                message.channel.send(morse.encode(`------- Skill: ${SkillName} -------`+'\n' +
                                      SkillDescription))
                    .catch(err => { console.log(`failed to send message for ${skillNameArg}`); });
            } else {
                console.log(`"${SkillName}" was requested which exists but has no description`);
            }
        
            //var cardImageURL = `http://downloads.stormwarsgame.com/cards/${URLCardName}.png`;
            //const attachment = new Discord.Attachment(cardImageURL);
            //message.channel.send(attachment)
            //    .catch(err => { console.log(`"${URLCardName}" was requested which exists but has no image`); });
        } else {
            message.channel.send(morse.encode(`Skill "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`));
        }
        
    }
}