const Discord = require('discord.js');
const ImageHandler = require('../common/EquipImageHandler.js');
const { EQUIP_ALIAS_PATH } = require('../strings.js');
const DbEx = require('../common/DbExtensions.js');

const standardLimit = 30;

//pre-prepare the mapping of names and aliases to canonical equip names
let equipAliasMap;
let equipCollection
reparse();

module.exports = {
    name: 'equip',
    aliases: ['equips'],
    description: 'Displays the named equip',
    usage: 'EQUIP NAME',
    args: true,
  
    run : async (message, args) => {
        const equipNameArg = args.join('').replace(/'+/g,'').toLowerCase();

        const URLEquipName = equipAliasMap.get(equipNameArg);
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
                message.channel.send(`${matchingEquips.size} equips were found matching "${args.join(' ')}".`)
                .then(()=>{
                    matchingEquips.forEach((equip, equipName, map) => {
                        ImageHandler.GetImageAttachment(equip.URLEquipName)
                        .then(attachment => {
                            message.channel.send(attachment)
                            .catch(err => { console.log(err); });
                        })
                        .catch(err => { console.log(err); });
                    });                                
                })
                .catch(err => { console.log(err); });
            } else {
            //Lots of Matches
                const data = [];
                data.push(`${matchingEquips.size} equips were found matching "${args.join(' ')}".`);

                matchingEquips.forEach((equip, equipName, map) => {
                    data.push(equipName);
                });

                message.author.send(data, { split : true })
                .then(()=>{
                    message.channel.send(`Answer sent as DM, ${matchingEquips.size} equips were found matching "${args.join(' ')}".`)
                    .catch(err => { console.log(err); });
                })
                .catch(error => {
                    message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
                });
            }          
        }
    },
    ReparseEquips : reparse
};

function reparse() {
    return Promise.resolve(console.log("reparse equips"))
    .then(() => DbEx.GetLargeObject(EQUIP_ALIAS_PATH))
    .then((equipData) => {
        console.log("rebuilding equips");
    
        equipAliasMap = new Discord.Collection();
        equipCollection = new Discord.Collection();
        for (let equip of equipData) {
            equip.SearchString = Object.values(equip).join(';').replace(/[' ]+/g,'').toLowerCase();
            equip.URLEquipName = equip.EQUIPNAME.toLowerCase().replace(/ +/g,'_');

            equipAliasMap.set(equip.EQUIPNAME.replace(/[' ]+/g,'').toLowerCase(), equip.URLEquipName);  
            for (let alias of (equip.ALIAS || "").replace(/[ ']+/g,'').toLowerCase().split(';')) {    
                equipAliasMap.set(alias, equip.URLEquipName);
            }
        
            equipCollection.set(equip.EQUIPNAME,equip);
        }   
        console.log("finished rebuilding equips");
    })
    .catch(console.log);
};