const Discord = require('discord.js');
const ImageHandler = require('../common/EquipImageHandler.js');

//pre-prepare the mapping of names and aliases to canonical equip names
const aliases = require('../EquipAlias.json');
const aliasMap = new Discord.Collection();
const equipCollection = new Discord.Collection();
for (let equip of aliases) {
    equip.SearchString = Object.values(equip).join(';').replace(/[' ]+/g,'').toLowerCase();
    equip.URLEquipName = equip.EQUIPNAME.toLowerCase().replace(/ +/g,'_');

    aliasMap.set(equip.EQUIPNAME.replace(/[' ]+/g,'').toLowerCase(), equip.URLEquipName);  
    for (let alias of (equip.ALIAS || "").replace(/[ ']+/g,'').toLowerCase().split(';')) {    
        aliasMap.set(alias, equip.URLEquipName);
    }
  
    equipCollection.set(equip.EQUIPNAME,equip);
}

for (let equip of aliases) {  
    const equipInfo = {
        URLEquipName : equip.EQUIPNAME.toLowerCase().replace(/ +/g,'_'),
        SearchString : (equip.ALIAS + ';' + equip.SEARCH).replace(/[ ']/g,'').toLowerCase()
    };
    /*card.NAME = card.CARDNAME.replace(/ +/g,'').toLowerCase();
    card.SET = card.SET.replace(/ +/g,'').toLowerCase();
    card.RARITY = card.RARITY.replace(/ +/g,'').toLowerCase();
    if(card.FACTION) { card.FACTION = card.FACTION.replace(/ +/g,'').toLowerCase() };
    if(card.TYPE){ card.TYPE = card.TYPE.replace(/ +/g,'').toLowerCase() };
    if(card.SKILL) { card.SKILL = card.SKILL.replace(/ +/g,'').toLowerCase() };
    if(card.ATTACKTYPE) { card.ATTACKTYPE = card.ATTACKTYPE.replace(/ +/g,'').toLowerCase() };
  
    card.URLCardName = card.CARDNAME.toLowerCase().replace(/ +/g,'_');
  
    cardCollection.set(card.CARDNAME, card);*/
}

module.exports = {
    name: 'equip',
    aliases: ['equips'],
    description: 'Displays the named equip',
    usage: 'EQUIP NAME',
    args: true,
  
    run : async (message, args) => {
        const equipNameArg = args.join('').replace(/'+/g,'').toLowerCase();

        const URLEquipName = aliasMap.get(equipNameArg);
        if (URLEquipName !== undefined) {
            ImageHandler.GetImageAttachment(URLEquipName)
              .then(attachment => {
                  message.channel.send(attachment)
                      .catch(err => { console.log(err); });
              })
              .catch(err => { console.log(err); });
        } else {            
            let matchingEquips = equipCollection;              
            matchingEquips = matchingEquips.filter(equip => equip.SearchString.includes(equipNameArg));
              
            if (matchingEquips.size === 0) {
            //No Matches
                message.channel.send(`No equip matching "${args.join(' ')}" found. Please check your spelling, or narrow your search term.`);
                return;
            } else if (matchingEquips.size === 1){
            //Only 1 match
            ImageHandler.GetImageAttachment(URLEquipName)
              .then(attachment => {
                  message.channel.send(attachment)
                      .catch(err => { console.log(err); });
              })
              .catch(err => { console.log(err); });
                return;
            }  else if (matchingEquips.size < 5){
            //A Few Matches
                message.author.send(`${matchingEquips.size} equips were found matching "${args.join(' ')}".`)
                              .then(()=>{
                                  matchingEquips.forEach((equip, equipName, map) => {
                                      ImageHandler.GetImageAttachment(equip.URLEquipName)
                                        .then(attachment => {
                                            message.author.send(attachment)
                                                .catch(err => { console.log(err); });
                                        })
                                        .catch(err => { console.log(err); });
                                  });                                
                              })
                              .catch(error=> {
                                  message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
                              });
            } else {
            //Lots of Matches
                const data = [];
                data.push(`${matchingEquips.size} equips were found matching "${args.join(' ')}".`);

                matchingEquips.forEach((equip, equipName, map) => {
                    data.push(equipName);
                });

                message.author.send(data, { split : true })
                              .catch(error => {
                                  message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
                              });
            }
          
            message.channel.send(`Answer sent as DM, ${matchingEquips.size} equips were found matching "${args.join(' ')}".`);
        }
    }
}