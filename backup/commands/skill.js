const Discord = require('discord.js');

//pre-prepare the mapping of names and aliases to canonical card names
const aliases = require('../SkillAlias.json');
const aliasMap = new Discord.Collection();
for (let aliasObject of aliases) {
    const URLSkillName = aliasObject.SKILLDESCRIPTION;  
    aliasMap.set(aliasObject.SKILLDESCRIPTION.replace(/ +/g,'').toLowerCase(), URLSkillName);  
    for (let alias of (aliasObject.ALIAS || "").replace(/ +/g,'').toLowerCase().split(';')) {    
        aliasMap.set(alias, URLSkillName);
    }
}


module.exports = {  
    name: 'skill',
    aliases: ['ability','skills'],
    description: 'Displays the skill description',
    usage: 'SKILL NAME',
    args: true,
  
    run : async (message, args) => {
        const cardNameArg = args.join('').toLowerCase();

        
        const URLSkillName = aliasMap.get(cardNameArg);
        if (URLSkillName !== undefined) {
            message.channel.send(`------- Skill: ${cardNameArg} -------`+'\n' +
                                 URLSkillName)
                .catch(err => { console.log(`"${URLSkillName}" was requested which exists but has no description`); });
        
            //var cardImageURL = `http://downloads.stormwarsgame.com/cards/${URLCardName}.png`;
            //const attachment = new Discord.Attachment(cardImageURL);
            //message.channel.send(attachment)
            //    .catch(err => { console.log(`"${URLCardName}" was requested which exists but has no image`); });
        } else {
            message.channel.send(`Skill "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`);
        }
        
    }
}