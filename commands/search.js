const Discord = require('discord.js');
const DbEx = require('../common/DbExtensions.js');
const ImageHandler = require('../common/CardImageHandler.js')
const { CARD_SEARCH_PATH } = require('../strings.js'); 
  
const searchTypes = ['name','type','skill','time','attack','health','attacktype', 'show', 'limit','set','rarity','faction'];

const relativeSearchTypes = ['time','cd','cooldown','attack','power','health','toughness','rarity']
const numericSearchTypes = ['time', 'cd','cooldown','attack','power','health','toughness'];
const otherSearchTypes = ['name','type','skill','attacktype','show', 'limit','set','faction'];

const publicSearchTypes = ['name','type','skill','time','attack','health','attacktype','set','rarity','faction'];
const publicRelativeSearchTypes = ['time','attack','health','rarity']


const factionAliases = [
  {key : 'a', aliases : ['atlantean', 'atlantian', 'blue']},
  {key : 'e', aliases : ['he', 'high', 'highe', 'highelf', 'highelves', 'highelfs', 'green']},
  {key : 'd', aliases : ['de', 'dark', 'darke', 'darkelf', 'darkelves', 'darkelfs', 'grey', 'black']},
  {key : 'o', aliases : ['ot', 'orc', 'orcs', 'orcish', 'orcishtribe', 'tribe', 'orcishtribes', 'tribes', 'orctribe', 'orctribes', 'ork', 'orks', 'red']},
  {key : 's', aliases : ['sp', 'spider', 'spiders', 'spiderpeople', 'spiderpeoples', 'pink', 'fuchsia']},
  {key : 'h', aliases : ['nh', 'nameless', 'horde', 'hordes', 'nameless horde', 'demon', 'demons', 'hell', 'purple', 'violet', 'indigo']},
  {key : 'x', aliases : ['none', 'spell', 'spells', 'nofaction', 'teal', 'aquamarine', 'turquoise']}
];
const factionMap = CreateAliasMapCollection(factionAliases);

const rarityAliases = [
  {key : 0, aliases : ['c', 'common', 'brown', 'bronze', 'black']},
  {key : 1, aliases : ['u', 'uncommon', 'grey', 'silver']},
  {key : 2, aliases : ['r', 'rare', 'yellow', 'gold']},
  {key : 3, aliases : ['e', 'epic', 'purple', 'timeshifted']},
  {key : 4, aliases : ['l', 'legend', 'legendary', 'red', 'mythic']}
];
const rarityMap = CreateAliasMapCollection(rarityAliases);

const attackTypeAliases = [
    {key : 'b', aliases : ['basic', 'base', 'melee']},
    {key : 'r', aliases : ['range', 'ranged', 'ranger']},
    {key : 'x', aliases : ['n', 'none', 'neither', 'noattack']}
];
const attackTypeMap = CreateAliasMapCollection(attackTypeAliases);

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
    description: 'Finds cards matching the given criteria',
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
                                 '•`!search wolf` will search for "wolf" anywhere on the card.\n' + 
                                 '•`!search type wolf` will search for "wolf" only in the card types.\n' + 
                                 '•`!search health 5; type infantry` will search for all infantry with 5 health.\n' + 
                                 '•`!search type infantry; shield` will search for all infantry with "shield" anywhere on the card.\n' + 
                                 '•`!search skill wind shield; attack>3` will search for all units with "wind shield" as a skill that also have attack greater than 3.\n' +
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
            for(let constraint of searchConstraints){
                if (otherSearchTypes.includes(constraint[0])) {
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
                    } else if (searchType === 'faction') {
                        const factionKey = factionMap.get(constraint);
                        if (factionKey) {
                            matchingCards = matchingCards.filter(card => card.FACTION === factionKey);
                        } else {
                            message.reply(`I didn\'t recognise the faction "${searchString}", so I ignored it`);
                        }
                    } else if (searchType === 'attacktype') {
                        const attackTypeKey = attackTypeMap.get(constraint);
                        if (attackTypeKey) {
                            matchingCards = matchingCards.filter(card => card.ATTACKTYPE === attackTypeKey);
                        } else {
                            message.reply(`I didn\'t recognise the attacktype "${searchString}", so I ignored it`);
                        }
                    } else if(searchType === 'show' || searchType === 'limit'){
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
                        if  (!isNaN(numConstraint)) {
                            if (searchType === 'time' || searchType === 'cd' || searchType === 'cooldown') {
                                matchingCards = matchingCards.filter(card => operator.operation(card.TIME,numConstraint));
                            } else if (searchType === 'attack' || searchType === 'power') {
                                matchingCards = matchingCards.filter(card => operator.operation(card.ATTACK,numConstraint));  
                            } else if (searchType === 'health' || searchType === 'toughness') {
                                matchingCards = matchingCards.filter(card => operator.operation(card.HEALTH,numConstraint));  
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


function reparse(debug = false){
    return Promise.resolve(console.log("reparse search"))
    .then(() => DbEx.GetLargeObject(CARD_SEARCH_PATH, debug))
    .then((cards) => {
        console.log("rebuilding search");
        //return;
        cardCollection = [];
        for (let card of cards) {  
            card.NAME = card.CARDNAME.replace(/ +/g,'').toLowerCase();
            card.SET = card.SET.replace(/ +/g,'').toLowerCase();
            card.RARITY = card.RARITY.replace(/ +/g,'').toLowerCase();
            card.RARITYLEVEL = rarityMap.get(card.RARITY);
            if(card.FACTION) { card.FACTION = card.FACTION.replace(/ +/g,'').toLowerCase(); }
            if(card.TYPE){ card.TYPE = card.TYPE.replace(/ +/g,'').toLowerCase(); }
            if(card.SKILL) { card.SKILL = card.SKILL.replace(/ +/g,'').toLowerCase(); }
            if(card.ATTACKTYPE) { 
                card.ATTACKTYPE = card.ATTACKTYPE.replace(/ +/g,'').toLowerCase();
                card.ATTACKTYPESEARCHSTRING = (card.ATTACKTYPE === 'r' ? 'rangedranger' : 'basicmelee');
            } else if (card.TYPE !== 'spell') {
                card.ATTACKTYPE = 'x'
                card.ATTACKTYPESEARCHSTRING = 'none'
            }
        
            card.SearchString = Object.values(card).join(';');
            card.URLCardName = card.CARDNAME.toLowerCase().replace(/ +/g,'_');
        
            cardCollection.push(card);
        }
        console.log("finished rebuilding search");
    })
    .catch(console.log);
};