//this is just a backup because i didn't do it properly
const Discord = require('discord.js');
const DbEx = require('../common/DbExtensions.js');
const { HISTORY_PATH } = require('../strings.js'); 
//const ImageHandler = require('../common/CardImageHandler.js')
  
const prefixes = ['date','version','tag','tags','comment','show','limit'];
const searchTypes = ['date','version','tag','comment'];
const textSearchTypes = ['tag','comment'];

const relativeSearchTypes = ['date','version'];
const defaultOperator = {key : '=',  operation : (a,b) => a==b };
relativeOperatorTypes = ['=','!=','>=','<=','>','<']
const relativeOperators = [
    //subsets must come after supersets. e.g. "==", "<=", ">=", "!=" all contain "=", so "=" must be after them
  {key : '==', operation : (a,b) => a==b },
  {key : '>=', operation : (a,b) => a>=b },
  {key : '<=', operation : (a,b) => a<=b },
  {key : '!=', operation : (a,b) => a!=b },
  {key : '<>', operation : (a,b) => a!=b },
  {key : '>',  operation : (a,b) => a>b  },
  {key : '<',  operation : (a,b) => a<b  },
  defaultOperator
]

const standardLimit = 30;
//pre-prepare the mapping of names and aliases to canonical card names
let historyArray;
reparse();

module.exports = {
    name: 'history',
    aliases: ['patch', 'patchnotes'],
    description: 'Digs through the patch notes of the games history',
    usage: '(a series of search criteria. use `!history help` for more info)',
    args: true,
    
    run : async (message, args) => {
        if (args.length === 1 && args[0] === 'help'){
            message.channel.send('This command takes a series of criteria separated by ";" semicolons.\n' +
                                'Each criterion is one of the forms: <SEARCH TERM>, <ATTRIBUTE> <SEARCH TERM>, or <ATTRIBUTE> <COMPARISON> <SEARCH TERM>.\n' + 
                                '• Without the attribute, the search will look for the term in any part of the history entry.\n' +
                                '• With an attribute, the search will only apply the term to that specific part of the entry.\n' + 
                                `\t• Accepted attributes are: \`${searchTypes.join(', ')}\`.\n` + 
                                `• You can also provide a comparison for \`${relativeSearchTypes.join(', ')}\` to search a range instead of just matches\n`+
                                `\t• Accepted comparisons are: \`${relativeOperatorTypes.join(', ')}\`.\n` + 
                                '\n' +
                                'Examples:\n' + 
                                '•`!search 2` will search for "2" anywhere in the entry.\n' + 
                                '•`!search version 2` will find entries from version 2.00.\n' + 
                                '•`!search version>2` will find entries from after version 2.00\n' + 
                                '•`!search tag balance; date>=2020-01-01` will search for all entries pertaining to balance since the start of 2020.\n' + 
                                '\n' + 
                                'Results are automatically limited to the first 30 results, but this can be overriden with the `show` or `limit` prefixes.\n' + 
                                'E.g. `!search version>2;show all` will find and show all entries after 2.00 instead of just showing the first 30.\n' +
                                '\n'+
                                'NOTE: the `tag` attribute is still in ***alpha*** as not all entries have been fully classfied yet'
                    );
        } else {
            //reparse args
            let searchConstraints = args.join(' ').replace(/ *; */g,';').toLowerCase().split(';').map(a => a.split(' '));
            let matchingEntries = historyArray;
            let limit = standardLimit;
          
            //Loop over the constraints presented and attempt to apply each one
            for(let constraint of searchConstraints){
                if (relativeSearchTypes.some(type => constraint[0].startsWith(type))){   
                    const originalConstraint = constraint.join(' ');
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

                    if(searchType === 'date'){ 
                        constraint = constraint.join(' ');
                        const dateConstraint = new Date(constraint);
                        if(!isNaN(dateConstraint)){                            
                            matchingEntries = matchingEntries.filter(entry => operator.operation(entry.PARSEDDATE,dateConstraint));
                        }else{
                            message.reply(`I didn\'t recognise the ${searchType} "${constraint}" as a date, so I ignored it`).catch(console.log);
                        }
                    } else if (searchType === 'version'){
                        constraint = constraint.join('');
                        const numConstraint = parseFloat(constraint,10);
                        if  (!isNaN(numConstraint)) {
                            matchingEntries = matchingEntries.filter(entry => operator.operation(entry.VERSION,numConstraint));
                        } else {
                            message.reply(`I didn\'t recognise the ${searchType} "${constraint}" as a number, so I ignored it`).catch(console.log);
                        }
                    } else{     
                        message.reply(`I couldn't understand the relative constraint "${originalConstraint}", so I treated it as a general search`).catch(console.log);
                        console.log(`originalConstraint:"${originalConstraint}",searchType:"${searchType}",operator:"${operator}"`)
                        constraint = originalConstraint.replace(/ +/g,'');
                        matchingEntries = matchingEntries.filter(entry => entry.SearchString.includes(constraint));                   
                    }
                } else if (prefixes.includes(constraint[0])) {
                    const searchType = constraint.shift();
                    const searchString = constraint.join(' ');
                    constraint = constraint.join('');
                    
                    if (searchType === 'tag' || searchType === 'tags') {  
                        matchingEntries = matchingEntries.filter(entry => entry.TAGS.includes(constraint));  
                    } else if(searchType === 'show' || searchType === 'limit'){
                        if(constraint === 'all'){
                            limit = Infinity;
                        } else {
                            const constraintNum = parseInt(constraint,10);
                            if  (!isNaN(constraintNum)) {
                                limit = constraintNum;
                            } else {
                                message.reply(`I didn\'t recognise the limit "${searchString}" as a number, so I ignored it`).catch(console.log);
                            }
                        }
                    }
                } else {
                    constraint = constraint.join('');
                    matchingEntries = matchingEntries.filter(entry => entry.SearchString.includes(constraint));
                }
            }

          //figure out how to present the remaining results to the user
            if (matchingEntries.length === 0) {
            //No Matches
                message.channel.send(`No entries matching your search criteria were found.`).catch(console.log);
                return;
            } else {
            //Some Matches
                const data = [];
                data.push(`${matchingEntries.length} entries were found matching your search criteria.`);

                matchingEntries.sort((a,b) => a.DATE==b.DATE ? a.VERSION-b.VERSION : a.DATE-b.DATE);

                if (matchingEntries.length > limit) {
            //Too Many Matches
                    data.push(`(This is only the first ${limit} of them, add **;show all** to your query if you want the full list)`);
                    matchingEntries = matchingEntries.slice(0,limit);
                }
                data.push('```');
                matchingEntries.forEach(entry => {
                    data.push(`${entry.DATESTRING}\tv${entry.VERSION ? entry.VERSION.toFixed(2) : "\t"}\t${entry.OriginalComment}`);
                });
                data.push('```');

                if(matchingEntries.length > standardLimit){
                    message.author.send(data, { split : {prepend: '```', append: '```'} })
                    .catch(error => {
                        message.reply('it seems like I can\'t DM you! Do you have DMs disabled?').catch(console.log);
                    });
                    message.channel.send(`Answer sent as DM, search found: ${matchingEntries.length} results`).catch(console.log)
                }else{
                    message.channel.send(data, { split : {prepend: '```', append: '```'} }).catch(console.log)
                }
            }

            return;
        }
    },

    ReparseHistory : reparse
}

function reparse(){
    return Promise.resolve(console.log("reparse history"))
    .then(() => DbEx.GetLargeObject(HISTORY_PATH))
    .then((historyData) => {
        console.log("rebuilding history");

        historyArray = [];
        for (let entry of historyData) {
            entry.PARSEDDATE = new Date(1900, 0, entry.DATE);
            entry.DATESTRING = entry.PARSEDDATE.toISOString().substring(0,10);
            //entry.VERSION = ;
            entry.TAGS = entry.TAGS.replace(/ +/g,'').toLowerCase();
            entry.OriginalComment = entry.COMMENT;
            entry.COMMENT = entry.COMMENT.replace(/ +/g,'').toLowerCase();

            entry.SearchString = Object.values(entry).join(';');
        
            historyArray.push(entry);
        }
        console.log("finished rebuilding history");
    })
    .catch(console.log);
}