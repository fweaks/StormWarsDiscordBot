const Discord = require('discord.js');
const DbEx = require('../common/DbExtensions.js');
const ImageHandler = require('../common/CardImageHandler.js')
const { CARD_SEARCH_PATH } = require('../strings.js'); 
const v8 = require('v8');
  
const relativeSearchTypes = ['gold', 'cost','attack','power','health','toughness','rarity']
const numericSearchTypes = ['gold', 'cost','attack','power','health','toughness'];
const otherSearchTypes = ['name','type','ability','skill','tag','show','limit','faction'];

const publicSearchTypes = ['name','type','ability','gold','attack','health','rarity','faction','tag'];
const publicRelativeSearchTypes = ['gold','attack','health','rarity']


const factionAliases = [
  {key : 'pirates', aliases : ['pirate', 'green']},
  {key : 'ninjas', aliases : ['ninja', 'purple']},
  {key : 'warlocks', aliases : ['warlock', 'red']},
  {key : 'vikings', aliases : ['viking', 'blue']},
  {key : 'druids', aliases : ['druid', 'white']},
  {key : 'crusaders', aliases : ['crusader', 'crusade', 'yellow']},
  {key : 'neutral', aliases : ['neutrals', 'none', 'brown']}
];
const factionMap = CreateAliasMapCollection(factionAliases);

const rarityAliases = [
  {key : 0, aliases : ['b', 'none']},
  {key : 1, aliases : ['c', 'common', 'wood', 'steel', 'silver', 'brown', 'grey', 'tan']},
  {key : 2, aliases : ['r', 'rare', 'blue', 'teal']},
  {key : 3, aliases : ['e', 'epic', 'purple', 'pink']},
  {key : 4, aliases : ['l', 'legend', 'legendary', 'gold', 'yellow']}
];
const rarityMap = CreateAliasMapCollection(rarityAliases);

const typeAliases = [
    {key : 'unit', aliases : ['units', 'creature', 'creatures']},
    {key : 'spell', aliases : ['spells', 'instant', 'sorcery']},
    {key : 'building', aliases : ['buildings', 'structure', 'structures']}
];
const typeMap = CreateAliasMapCollection(typeAliases);

const defaultOperator = {key : '=',  operation : (a,b) => a==b };
relativeOperatorTypes = ['=','!=','>=','<=','>','<']
const relativeOperators = [
    //subsets must come after supersets. e.g. "==", "<=", ">=", "!=" all contain "=", so "=" must be after them
  {key : '==', operation : (a,b) => a==b },
  {key : '>=', operation : (a,b) => a>=b },
  {key : '=>', operation : (a,b) => a>=b },
  {key : '<=', operation : (a,b) => a<=b },
  {key : '=<', operation : (a,b) => a<=b },
  {key : '!=', operation : (a,b) => a!=b },
  {key : '<>', operation : (a,b) => a!=b },
  {key : '>',  operation : (a,b) => a>b  },
  {key : '<',  operation : (a,b) => a<b  },
  defaultOperator
]

const standardLimit = 30;

//pre-prepare the mapping of names and aliases to canonical card names
let cardCollection;
reparse();

module.exports = {
    name: 'search',
    aliases: ['find'],
    description: 'Finds cards matching the given criteria (use !search help for more info)',
    usage: '(a series of search criteria. use `!search help` for more info)',
    args: true,
    
    run : async (message, args) => {
        if (args.length === 1 && args[0] === 'help'){
            message.channel.send('This command takes a series of criteria separated by ";" semicolons.\n' +
                                 'Each criterion is either of the form <SEARCH TERM> or <ATTRIBUTE> <SEARCH TERM>.\n' + 
                                 '• Without the attribute, the search will look for the term in any part of the card.\n' +
                                 '• With an attribute, the search will only apply the term to that specific part of the card.\n' + 
                                 `\t• Accepted attributes are: \`${publicSearchTypes.join(', ')}\`.\n` + 
                                 `• You can also provide a comparison for \`${publicRelativeSearchTypes.join(', ')}\` to search a range instead of just matches\n`+
                                 `\t• Accepted comparisons are: \`${relativeOperatorTypes.join(', ')}\`.\n` + 
                                 '\n' +
                                 'Examples:\n' + 
                                 '•`!search dragon` will search for "dragon" anywhere on the card.\n' + 
                                 '•`!search tag dragon` will search for "dragon" only in the card tags.\n' + 
                                 '•`!search health 5; tag dragon` will search for all cards with the "dragon" tag that have 5 health.\n' + 
                                 '•`!search faction crusaders; armor` will search for all crusader cards with "armor" anywhere on the card.\n' + 
                                 '•`!search ability armor; attack>2` will search for all units with "armor" as an ability that also have attack greater than 3.\n' +
                                 '\n' + 
                                 'Results are automatically limited to the first 30 results, but this can be overriden with the `show` or `limit` prefixes.\n' + 
                                 'E.g. `!search type infantry;show all` will search for and show all infantry type units instead of just showing the first 30.\n' 
                              );
        } else {
            //reparse args
            let searchConstraints = args.join(' ').replace(/ *; */g,';').toLowerCase().split(';').map(a => a.split(' '));
            let matchingCards = cardCollection;
            let limit = standardLimit;
          
            //Loop over the constraints presented and attempt to apply each one
            for (let constraint of searchConstraints) {
                if (otherSearchTypes.includes(constraint[0])) {
                    const searchType = constraint.shift();
                    const searchString = constraint.join(' ');
                    constraint = constraint.join('');
                    
                    switch (searchType) {
                        case 'name':
                            matchingCards = matchingCards.filter(card => card.NAME.includes(constraint));
                            break;
                        case 'tag':
                            matchingCards = matchingCards.filter(card => card.TAG && card.TAG.includes(constraint));                              
                            break;
                        case 'ability':
                        case 'skill':
                            matchingCards = matchingCards.filter(card => card.ABILITY && card.ABILITY.includes(constraint));    
                            break;
                        case 'faction':
                            const factionKey = factionMap.get(constraint);
                            if (factionKey) {
                                matchingCards = matchingCards.filter(card => card.FACTION === factionKey);
                            } else {
                                message.reply(`I didn\'t recognise the faction "${searchString}", so I ignored it`);
                            }
                            break;
                        case 'type':
                            const typeKey = typeMap.get(constraint);
                            if (typeKey) {
                                matchingCards = matchingCards.filter(card => card.TYPE === typeKey);
                            } else {
                                message.reply(`I didn\'t recognise the type "${searchString}", so I ignored it`);
                            }
                            break;
                        case 'show':
                        case 'limit':
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
                            break;
                    }
                } else if (relativeSearchTypes.some(type => constraint[0].startsWith(type))){   
                    let originalConstraint = constraint.join(' ');
                    let searchType;
                    let operator;
                    
                    for(let i=0; i<relativeOperators.length; i++){
                        let op = relativeOperators[i];
                        if(originalConstraint.includes(op.key)){
                            //console.log('matched ' + op.key);
                            constraint = originalConstraint.split(op.key).map(a => a.replace(/^ +| +$/g,''));
                            searchType = constraint.shift();
                            operator = op;
                            break;
                        }
                    }
                    if(!operator){
                        searchType = constraint.shift();
                        operator = defaultOperator;
                    }

                    if(searchType === 'rarity'){ 
                        constraint = constraint.join('');
                        const rarityConstraint = rarityMap.get(constraint);
                        if(rarityConstraint){                            
                            matchingCards = matchingCards.filter(entry => operator.operation(entry.RARITYLEVEL,rarityConstraint));
                        }else{
                            message.reply(`I didn\'t recognise the ${searchType} "${constraint}", so I ignored it`).catch(console.log);
                        }
                    } else if (numericSearchTypes.includes(searchType)){
                        constraint = constraint.join('');
                        const numConstraint = parseFloat(constraint,10);
                        if (!isNaN(numConstraint)) {
                            switch (searchType) {
                                case 'cost':
                                case 'gold':
                                    matchingCards = matchingCards.filter(card => operator.operation(card.GOLD,numConstraint));
                                    break;
                                case 'attack':
                                case 'power':
                                    matchingCards = matchingCards.filter(card => operator.operation(card.ATTACK,numConstraint));  
                                    break;
                                case 'health':
                                case 'toughness':
                                    matchingCards = matchingCards.filter(card => operator.operation(card.HEALTH,numConstraint));  
                                    break;
                            }
                        } else {
                            message.reply(`I didn\'t recognise the ${searchType} "${constraint}" as a number, so I ignored it`).catch(console.log);
                        }
                    } else{     
                        message.reply(`I couldn't understand the relative constraint "${originalConstraint}", so I treated it as a general search`).catch(console.log);
                        console.log(`originalConstraint:"${originalConstraint}",searchType:"${searchType}",operator:"${operator}"`)
                        constraint = originalConstraint.replace(/ +/g,'');
                        matchingCards = matchingCards.filter(entry => entry.SearchString.includes(constraint));                   
                    }
                } else {
                    constraint = constraint.join('');
                    matchingCards = matchingCards.filter(card => card.SearchString.includes(constraint));
                }
            }

          //figure out how to present the remaining results to the user
            if (matchingCards.length === 0) {
            //No Matches
                message.channel.send(`No cards matching your search criteria were found.`);
                return;
            } else if (matchingCards.length < 5){
            //A Few Matches
                message.channel.send(`${matchingCards.length} cards were found matching your search criteria.`)
                .then(()=>{
                    matchingCards.forEach((card, cardName, map) => {
                        ImageHandler.GetImageAttachment(card.URLCardName)
                            .then(attachment => {
                                message.channel.send(attachment)
                                    .catch(console.log);
                            })
                            .catch(console.log);
                    });                                
                })
                .catch(console.log);
            } else {
            //Lots of Matches
                const data = [];
                data.push(`${matchingCards.length} cards were found matching your search criteria.`);

                if (matchingCards.length > limit) {
            //Too Many Matches
                    data.push(`(This is only the first ${limit} of them, add **;show all** to your query if you want the full list)`);    
                    matchingCards = matchingCards.slice(0,limit);
                }     
                matchingCards.forEach(card => {
                    data.push(card.CARDNAME);
                });

                if(matchingCards.length > standardLimit){
                    message.author.send(data, { split : true })
                    .catch(error => {
                        message.reply('it seems like I can\'t DM you! Do you have DMs disabled?').catch(console.log);
                    });
                    message.channel.send(`Answer sent as DM, search found: ${matchingCards.length} results`).catch(console.log)
                }else{
                    message.channel.send(data, { split : true }).catch(console.log)
                }
            }
            return;
        }
    },

    ReparseSearch : reparse
};

function CreateAliasMapCollection(aliases){
    const map = new Discord.Collection();
    for (let kvp of aliases) {
        map.set(kvp.key, kvp.key);
        for (let alias of kvp.aliases) {
            map.set(alias, kvp.key);
        }
    }
    return map;
};


async function reparse(debug = false){
    console.log("reparse search")
    try {
        cards = await DbEx.GetLargeObject(CARD_SEARCH_PATH, debug);
        console.log("rebuilding search");
        cardCollection = [];
        for (let originalCard of cards) {  
            let card = v8.deserialize(v8.serialize(originalCard));//deep copy
            card.NAME = card.CARDNAME.replace(/ +/g,'').toLowerCase();
            card.TAG = card.TAG.replace(/ +/g,'').toLowerCase();
            card.RARITY = card.RARITY.replace(/ +/g,'').toLowerCase();
            card.RARITYLEVEL = rarityMap.get(card.RARITY);
            card.FACTION = card.FACTION.replace(/ +/g,'').toLowerCase();
            card.TYPE = card.TYPE.replace(/ +/g,'').toLowerCase();
            if(card.ABILITY) { card.ABILITY = card.ABILITY.replace(/ +/g,'').toLowerCase(); }
        
            card.SearchString = Object.values(card).join(';');
            card.URLCardName = card.CARDNAME.replace(/ +/g,'_');
        
            cardCollection.push(card);
        }
        console.log("finished rebuilding search");
    } catch (error) {
        console.log(error);
    }
};