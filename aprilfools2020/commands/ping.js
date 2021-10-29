const {Encode} = require('./encode.js');

module.exports = {
    name: 'ping',
    description: 'Gets a ping.',
    usage: '',
    hidden: true,
  
    run : async (message, args) => {
        await message.channel.send(Encode(`${Date.now() - message.createdTimestamp}ms`));
    }
}