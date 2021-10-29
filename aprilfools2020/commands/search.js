const Discord = require('discord.js');
const {CARD_IMAGE_URL} = require('../../strings.js');
const {Encode} = require('./encode.js');
  
const prefixes = ['name','ability','skill','gold','cost','attack','tag','type','health','show','limit','rarity','faction'];
const searchTypes = ['name','ability','gold','attack','health','tag','type','rarity','faction'];
const numericSearchTypes = ['gold','cost','attack','health'];
const textSearchTypes = ['name','tag','type','ability','skill','rarity'];

const factionAliases = [
  {key : 'pirates', aliases : ['pirate', 'green']},
  {key : 'ninjas', aliases : ['ninja', 'purple']},
  {key : 'warlocks', aliases : ['warlock', 'red']},
  {key : 'vikings', aliases : ['viking', 'blue']},
  {key : 'druids', aliases : ['druid', 'white']},
  {key : 'crusaders', aliases : ['crusader', 'crusade', 'yellow']},
  {key : 'neutral', aliases : ['neutrals', 'none', 'brown']}
];

//pre-prepare the mapping of names and aliases to canonical card names
const cards = require('../../CardSearch.json');
const cardCollection = new Discord.Collection();
for (let card of cards) {  
    card.Name = card.Cardname.replace(/ +/g,'').toLowerCase();
    card.Rarity = card.Rarity.replace(/ +/g,'').substr(0,1).toLowerCase();
    if(card.Faction) { card.Faction = card.Faction.replace(/ +/g,'').toLowerCase() };
    if(card.Tag){ card.Tag = card.Tag.replace(/ +/g,'').toLowerCase() };
    if(card.Ability) { card.Ability = card.Ability.replace(/ +/g,'').toLowerCase() };
    if(card.Type) { card.Type = card.Type.replace(/ +/g,'').toLowerCase() };
  
    card.SearchString = Object.values(card).join(';');
    card.URLCardName = card.Cardname.replace(/ +/g,'_');
  
    cardCollection.set(card.Cardname, card);
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
    description: 'Finds cards matching the given criteria (use !search help for more info)',
    usage: '(a series of search criteria. use !search help for more info)',
    args: true,
    
    run : async (message, args) => {
        if (args.length === 1 && args[0] === 'help'){
            message.channel.send(Encode('This command takes a series of criteria separated by ";" semicolons.')+'\n' +
                                 Encode('Each criterion is either of the form <SEARCH TERM> or <prefix> <SEARCH TERM>.')+'\n' + 
                                 '• '+Encode('Without the prefix, the search will look for the term in any part of the card.')+'\n' +
                                 '• '+Encode('With an attribute prefix, the search will only apply the term to that specific part of the card.')+'\n' + 
                                 '\t• '+Encode(`Accepted attributes are: \`${searchTypes.join(', ')}\`.`)+'\n' + 
                                 '\n' +
                                 Encode('Examples:')+'\n' + 
                                 '•'+Encode('`!search dragon` will search for "dragon" anywhere on the card.')+'\n' + 
                                 '•'+Encode('`!search tag dragon` will search for "dragon" only in the card tags.')+'\n' + 
                                 '•'+Encode('`!search tag dragon; health 5` will search for all cards with the "dragon" tag that have 5 health.')+'\n' + 
                                 '•'+Encode('`!search faction crusaders; armor` will search for all crusader cards with "armor" anywhere on the card.')+'\n' + 
                                 '•'+Encode('`!search faction crusaders; ability armor` will search for all crusader cards with the "armor" ability.')+'\n' +
                                 '\n' + 
                                 Encode('Results are automatically limited to the first 30 results, but this can be overriden with the `show` or `limit` prefixes.')+'\n' + 
                                 Encode('E.g. `!search faction pirates; show all` will search for and show all pirate cards instead of just showing the first 30.')+'\n' 
                              );
        } else {
            //reparse args
            let searchConstraints = args.join(' ').replace(/ *; */g,';').toLowerCase().split(';').map(a => a.split(' '));
            let matchingCards = cardCollection;
            let limit = 30;
            for(let constraint of searchConstraints){
                if (prefixes.includes(constraint[0])) {
                    const searchType = constraint.shift();
                    const searchString = constraint.join(' ');
                    constraint = constraint.join('');
                    
                    if (['name','cardname'].includes(searchType)) {
                        matchingCards = matchingCards.filter(card => card.Name.includes(constraint));
                    } else if (['tags','tag'].includes(searchType)) {  
                        matchingCards = matchingCards.filter(card => card.Tag && card.Tag.includes(constraint));  
                    } else if (['type','types'].includes(searchType)) {  
                        matchingCards = matchingCards.filter(card => card.Type && card.Type.includes(constraint));  
                    } else if (['skill','ability', 'skills', 'abilities'].includes(searchType)) {
                        matchingCards = matchingCards.filter(card => card.Ability && card.Ability.includes(constraint));    
                    } else if (['rarity','rarities'].includes(searchType)) {
                        matchingCards = matchingCards.filter(card => constraint.startsWith(card.Rarity));      
                    } else if (['faction','race'].includes(searchType)) {
                        const factionKey = factionMap.get(constraint);
                        if (factionKey) {
                            matchingCards = matchingCards.filter(card => card.Faction && card.Faction.includes(factionKey));
                        } else {
                            message.reply(`I didn\'t recognise the faction "${searchString}", so I ignored it`);
                        }
                    } else if (numericSearchTypes.includes(searchType)) {
                        const constraintNum = parseInt(constraint,10);
                        if  (!isNaN(constraintNum)) {
                            if (['gold','cost'].includes(searchType)) {
                                matchingCards = matchingCards.filter(card => card.Gold === constraintNum);
                            } else if (searchType === 'attack') {
                                matchingCards = matchingCards.filter(card => card.Attack === constraintNum);  
                            } else if (searchType === 'health') {
                                matchingCards = matchingCards.filter(card => card.Health === constraintNum);  
                            }
                        } else {
                            message.reply(`I didn\'t recognise the ${searchType} "${searchString}" as a number, so I ignored it`);
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

            if (matchingCards.size === 0) {
            //No Matches
                message.channel.send(Encode(`No cards matching your search criteria were found.`));
                return;
            } else if (matchingCards.size < 5){
            //A Few Matches
                message.author.send(Encode(`${matchingCards.size} cards were found matching your search criteria.`))
                              .then(()=>{
                                  matchingCards.forEach((card, cardName, map) => {
                                      var cardImageURL = CARD_IMAGE_URL.replace('${URLCardName}', card.URLCardName);
                                      const attachment = new Discord.Attachment(cardImageURL);
                                      message.author.send(attachment)
                                        .catch(err => { console.log(`"${card.URLCardName}" was requested which exists but has no image @ ${cardImageURL}`); });
                                  });                                
                              })
                              .catch(error=> {
                                  message.reply(Encode('it seems like I can\'t DM you! Do you have DMs disabled?'));
                              });
            } else {
            //Lots of Matches
                const data = [];
                data.push(Encode(`${matchingCards.size} cards were found matching your search criteria.`));

                if (matchingCards.size > limit) {
            //Too Many Matches
                    data.push(Encode(`(This is only the first ${limit} of them)`));      
                    matchingCards.firstKey(limit).forEach(cardName => {
                        data.push(Encode(cardName));
                    });
                } else {            
                    matchingCards.forEach((card, cardName, map) => {
                        data.push(Encode(cardName));
                    });
                }

                message.author.send(data, { split : true })
                              .catch(error => {
                                  message.reply(Encode('it seems like I can\'t DM you! Do you have DMs disabled?'));
                              });
            }

            message.channel.send(Encode(`Answer sent as DM, search found: ${matchingCards.size} results`));
            return;
        }
    }
}
