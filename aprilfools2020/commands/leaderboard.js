const {Encode} = require('./encode.js');

module.exports = {
    name: 'leaderboard',
    aliases: ['leaderboards', 'rank', 'ranks', 'ranking', 'rankings', 'lazerbread', 'lazerbreadz', 'lazerbreads', 'lb'],
    description: 'Gets a ping',
    usage: '',
    hidden: true,
  
    
    run : async (message, args) => {
        await message.channel.send(Encode('https://www.cardsandcastles.com/v2/rankings/'));
    }
}