var morse = require('../MorseCode.js');
const { HelpMessage } = require('../../strings.js')

module.exports = {
    name: 'help',
    description: 'Gives help',
    usage: '',
    cooldown: 5,
  
    run : async (message, args) => {
      message.channel.send(morse.encode(HelpMessage));
  }
}