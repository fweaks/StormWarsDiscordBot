//this is just a backup because i didn't do it properly
const Discord = require('discord.js');
const ImageHandler = require('../aprilfools2020/CardImageHandler.js')
  
const prefixes = ['name','type','skill','time','attack','health','attacktype', 'show', 'limit','set','rarity','faction'];
const searchTypes = ['name','type','skill','time','attack','health','attacktype','set','rarity','faction'];
const numericSearchTypes = ['time','attack','health'];
const textSearchTypes = ['name','type','skill','set','rarity'];

const factionAliases = [
  {key : 'a', aliases : ['a', 'atlantean', 'blue']},
  {key : 'e', aliases : ['e', 'he', 'high', 'highe', 'highelf', 'highelves', 'highelfs', 'green']},
  {key : 'd', aliases : ['d', 'de', 'dark', 'darke', 'darkelf', 'darkelves', 'darkelfs', 'grey', 'black']},
  {key : 'o', aliases : ['o', 'ot', 'orc', 'orcs', 'orcish', 'orcishtribe', 'tribe', 'orcishtribes', 'tribes', 'orctribe', 'orctribes', 'ork', 'orks', 'red']},
  {key : 's', aliases : ['s', 'sp', 'spider', 'spiders', 'spiderpeople', 'spiderpeoples', 'pink', 'fuschia']},
  {key : 'h', aliases : ['h', 'nh', 'nameless', 'horde', 'hordes', 'nameless horde', 'demon', 'demons', 'hell', 'purple', 'violet', 'indigo']},
  {key : 'x', aliases : ['x', 'none', 'spell', 'spells', 'nofaction', 'teal', 'aquamarine', 'turquoise']}
];

//pre-prepare the mapping of names and aliases to canonical card names
const cards = require('../CardSearch.json');
const cardCollection = new Discord.Collection();
for (let card of cards) {  
    card.NAME = card.CARDNAME.replace(/ +/g,'').toLowerCase();
    card.SET = card.SET.replace(/ +/g,'').toLowerCase();
    card.RARITY = card.RARITY.replace(/ +/g,'').toLowerCase();
    if(card.FACTION) { card.FACTION = card.FACTION.replace(/ +/g,'').toLowerCase() };
    if(card.TYPE){ card.TYPE = card.TYPE.replace(/ +/g,'').toLowerCase() };
    if(card.SKILL) { card.SKILL = card.SKILL.replace(/ +/g,'').toLowerCase() };
    if(card.ATTACKTYPE) { card.ATTACKTYPE = card.ATTACKTYPE.replace(/ +/g,'').toLowerCase() };
  
    card.SearchString = Object.values(card).join(';');
    card.URLCardName = card.CARDNAME.toLowerCase().replace(/ +/g,'_');
  
    cardCollection.set(card.CARDNAME, card);
}

const factionMap = new Discord.Collection();
for (let faction of factionAliases) {
    factionMap.set(faction.key, faction.key);
    for (let alias of faction.aliases) {
        factionMap.set(alias, faction.key);
    }
}

module.exports = {
    name: 'search',
    aliases: ['find'],
    description: 'Finds cards matching the given criteria',
    usage: '(a series of search criteria. use !search help for more info)',
    args: true,
    
    run : async (message, args) => {
        if (args.length === 1 && args[0] === 'help'){
            message.channel.send('This command takes a series of criteria separated by ";" semicolons.\n' +
                                 'Each criterion is either of the form <SEARCH TERM> or <prefix> <SEARCH TERM>.\n' + 
                                 '• Without the prefix, the search will look for the term in any part of the card.\n' +
                                 '• With an attribute prefix, the search will only apply the term to that specific part of the card.\n' + 
                                 `\t• Accepted attributes are: \`${searchTypes.join(', ')}\`.\n` + 
                                 '\n' +
                                 'Examples:\n' + 
                                 '•`!search wolf` will search for "wolf" anywhere on the card.\n' + 
                                 '•`!search type wolf` will search for "wolf" only in the card types.\n' + 
                                 '•`!search health 5; type infantry` will search for all infantry with 5 health.\n' + 
                                 '•`!search type infantry; shield` will search for all infantry with "shield" anywhere on the card.\n' + 
                                 '•`!search skill wind shield; attacktype ranged` will search for all units with "wind shield" as a skill that also have a ranged attack.\n' +
                                 '\n' + 
                                 'Results are automatically limited to the first 30 results, but this can be overriden with the `show` or `limit` prefixes.\n' + 
                                 'E.g. `!search type infantry;show all` will search for and show all infantry type units instead of just showing the first 30.\n' 
                              );
        } else {
            //reparse args
            let searchConstraints = args.join(' ').replace(/ *; */g,';').toLowerCase().split(';').map(a => a.split(' '));
            let matchingCards = cardCollection;
            let limit = 30;
          
            //Loop over the constraints presented and attempt to apply each one
            for(let constraint of searchConstraints){
                if (prefixes.includes(constraint[0])) {
                    const searchType = constraint.shift();
                    const searchString = constraint.join(' ');
                    constraint = constraint.join('');
                    
                    if (searchType === 'name') {
                        matchingCards = matchingCards.filter(card => card.NAME.includes(constraint));
                    } else if (searchType === 'type') {  
                        matchingCards = matchingCards.filter(card => card.TYPE && card.TYPE.includes(constraint));  
                    } else if (searchType === 'set') {
                        matchingCards = matchingCards.filter(card => card.SET.includes(constraint));
                    } else if (searchType === 'skill') {
                        matchingCards = matchingCards.filter(card => card.SKILL && card.SKILL.includes(constraint));    
                    } else if (searchType === 'rarity') {
                        matchingCards = matchingCards.filter(card => constraint.startsWith(card.RARITY));      
                    } else if (searchType === 'faction') {
                        const factionKey = factionMap.get(constraint);
                        if (factionKey) {
                            matchingCards = matchingCards.filter(card => card.FACTION && card.FACTION.includes(factionKey));
                        } else {
                            message.reply(`I didn\'t recognise the faction "${searchString}", so I ignored it`);
                        }
                    } else if (numericSearchTypes.includes(searchType)) {
                        const constraintNum = parseInt(constraint,10);
                        if  (!isNaN(constraintNum)) {
                            if (searchType === 'time') {
                                matchingCards = matchingCards.filter(card => card.TIME === constraintNum);
                            } else if (searchType === 'attack') {
                                matchingCards = matchingCards.filter(card => card.ATTACK === constraintNum);  
                            } else if (searchType === 'health') {
                                matchingCards = matchingCards.filter(card => card.HEALTH === constraintNum);  
                            }
                        } else {
                            message.reply(`I didn\'t recognise the ${searchType} "${searchString}" as a number, so I ignored it`);
                        }
                    } else if (searchType === 'attacktype') {
                        if (['b', 'basic', 'base', 'melee'].includes(constraint)){
                            matchingCards = matchingCards.filter(card => card.ATTACKTYPE === 'b'); 
                        } else if (['r', 'range', 'ranged', 'ranger'].includes(constraint)){
                            matchingCards = matchingCards.filter(card => card.ATTACKTYPE === 'r'); 
                        } else if (['none', 'neither'].includes(constraint)){
                            matchingCards = matchingCards.filter(card => !card.ATTACKTYPE && !card.TYPE.includes('SPELL')); 
                        } else {
                            message.reply(`I didn\'t recognise the attacktype "${searchString}", so I ignored it`);
                        }
                    } else if(['show','limit'].includes(searchType)){
                        if(constraint === 'all'){
                            limit = Infinity;
                        } else {
                            const constraintNum = parseInt(constraint,10);
                            if  (!isNaN(constraintNum)) {
                                limit = constraintNum;
                            } else {
                                message.reply(`I didn\'t recognise the limit "${searchString}" as a number, so I ignored it`);
                            }
                        }
                    }
                } else {
                    constraint = constraint.join('');
                    matchingCards = matchingCards.filter(card => card.SearchString.includes(constraint));
                }
            }

          //figure out how to present the remaining results to the user
            if (matchingCards.size === 0) {
            //No Matches
                message.channel.send(`No cards matching your search criteria were found.`);
                return;
            } else if (matchingCards.size < 5){
            //A Few Matches
                message.author.send(`${matchingCards.size} cards were found matching your search criteria.`)
                              .then(()=>{
                                  matchingCards.forEach((card, cardName, map) => {
                                      ImageHandler.GetImageAttachment(card.URLCardName)
                                          .then(attachment => {
                                              message.channel.send(attachment)
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
                data.push(`${matchingCards.size} cards were found matching your search criteria.`);

                if (matchingCards.size > limit) {
            //Too Many Matches
                    data.push(`(This is only the first ${limit} of them)`);      
                    matchingCards.firstKey(limit).forEach(cardName => {
                        data.push(cardName);
                    });
                } else {            
                    matchingCards.forEach((card, cardName, map) => {
                        data.push(cardName);
                    });
                }

                message.author.send(data, { split : true })
                              .catch(error => {
                                  message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
                              });
            }

            message.channel.send(`Answer sent as DM, search found: ${matchingCards.size} results`);
            return;
        }
    }
}
