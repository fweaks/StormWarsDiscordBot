const Discord = require('discord.js');
const { SKILL_ALIAS_PATH } = require('../strings.js');
const DbEx = require('../common/DbExtensions.js');

//pre-prepare the mapping of names and aliases to canonical card names
var skillAliasMap;
var descriptionMap;
reparse()

module.exports = {  
    name: 'ability',
    aliases: ['skill','skills', 'abilities'],
    description: 'Displays the ability description',
    usage: 'ability NAME',
    args: true,
  
    run : async (message, args) => {
        const skillNameArg = args.join('').toLowerCase();
        
        const SkillName = skillAliasMap.get(skillNameArg);
        if (SkillName !== undefined) {
            const SkillDescription = descriptionMap.get(SkillName);
            if (SkillDescription !== undefined) {
                message.channel.send(`------- Ability: ${SkillName} -------`+'\n' +
                                      SkillDescription)
                    .catch(err => { console.log(`failed to send message for ${skillNameArg}`); });
            } else {
                console.log(`"${SkillName}" was requested which exists but has no description`);
            }
        } else {
            message.channel.send(`Ability "${args.join(' ')}" not found. Please check your spelling, or narrow your search terms.`);
        }        
    },

    ReparseSkills : reparse
}

function reparse(debug = false){
    return Promise.resolve(console.log("reparse skills"))
    .then(() => DbEx.GetLargeObject(SKILL_ALIAS_PATH, debug))
    .then((skillData) => {
        console.log("rebuilding skills");

        skillAliasMap = new Discord.Collection();
        descriptionMap = new Discord.Collection();
        for (let skill of skillData) {
            descriptionMap.set(skill.ABILITY, skill.DESCRIPTION);
            skillAliasMap.set(skill.ABILITY.replace(/ +/g,'').toLowerCase(), skill.ABILITY);  
            for (let alias of (skill.ALIAS || "").replace(/ +/g,'').toLowerCase().split(';')) {    
                skillAliasMap.set(alias, skill.ABILITY);
            }
        }
        console.log("finished skills");
    })
    .catch(console.log); 
}