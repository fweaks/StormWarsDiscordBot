const { HelpMessage } = require('../../strings.js')
const {Encode} = require('./encode.js');

module.exports = {
    name: 'help',
    description: 'Gives help',
    usage: '',
    cooldown: 5,
  
    run : async (message, args) => {
      message.channel.send('try the encode and decode commands :D');
  }
}