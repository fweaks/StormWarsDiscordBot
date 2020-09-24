var morse = require('../MorseCode.js');
const Discord = require('discord.js');

//pre-prepare the mapping of names and aliases to canonical equip names
const aliases = require('../../EquipAlias.json');
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
            //var equipImageURL = `http://downloads.stormwarsgame.com/equips/${URLEquipName}.png`;
            //var equipImageURL = `https://d2mfjkuqgad2g.cloudfront.net/equips/${URLEquipName}.png`;
            var equipImageURL = `https://d3f7do5p5ldf15.cloudfront.net/Discord/equips/${URLEquipName}.png`;
            const attachment = new Discord.Attachment(equipImageURL);
            message.channel.send(attachment).catch(error => {
                console.log(`failed to load equip ${equipImageURL}`);
            });
        } else {            
            let matchingEquips = equipCollection;              
            matchingEquips = matchingEquips.filter(equip => equip.SearchString.includes(equipNameArg));
              
            if (matchingEquips.size === 0) {
            //No Matches
                message.channel.send(morse.encode(`No equip matching "${args.join(' ')}" found. Please check your spelling, or narrow your search term.`));
                return;
            } else if (matchingEquips.size === 1){
            //Only 1 match
                var equipImageURL = `http://downloads.stormwarsgame.com/equips/${matchingEquips.first().URLEquipName}.png`;
                const attachment = new Discord.Attachment(equipImageURL);
                message.channel.send(attachment).catch(error => {
                    console.log(`failed to load equip ${equipImageURL}`);
                });
                return;
            }  else if (matchingEquips.size < 5){
            //A Few Matches
                message.author.send(morse.encode(`${matchingEquips.size} equips were found matching "${args.join(' ')}".`))
                              .then(()=>{
                                  matchingEquips.forEach((equip, equipName, map) => {
                                      var equipImageURL = `http://downloads.stormwarsgame.com/equips/${equip.URLEquipName}.png`;
                                      const attachment = new Discord.Attachment(equipImageURL);
                                      message.author.send(attachment).catch();
                                  });                                
                              })
                              .catch(error=> {
                                  message.reply(morse.encode('it seems like I can\'t DM you! Do you have DMs disabled?'));
                              });
            } else {
            //Lots of Matches
                const data = [];
                data.push(`${matchingEquips.size} equips were found matching "${args.join(' ')}".`);

                matchingEquips.forEach((equip, equipName, map) => {
                    data.push(equipName);
                });

                message.author.send(morse.encode(data), { split : true })
                              .catch(error => {
                                  message.reply(morse.encode('it seems like I can\'t DM you! Do you have DMs disabled?'));
                              });
            }
          
            message.channel.send(`Answer sent as DM, ${matchingEquips.size} equips were found matching "${args.join(' ')}".`);
        }
    }
}