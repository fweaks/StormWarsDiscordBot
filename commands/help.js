const { HelpMessage } = require('../strings.js')

module.exports = {
    name: 'help',
    description: 'Gives help',
    usage: '',
    cooldown: 5,
  
    run : async (message, args) => {
      message.channel.send(
                'Hello, thanks for using the Storm Wars Chatbot!\n' +
      //        '• For heroes: !hero HERO NAME\n' +
                '• For a single card: `!card <CARD NAME>`\n' +
                '• For equips: `!equip <EQUIP NAME>`\n' +
                '• For skills: `!skill <SKILL NAME>`\n' +
                '• For flavour text: `!flavour <CARD NAME>`\n' +
                '• To search for cards: `!search <ATTRIBUTE> <SEARCH VALUE>`\n' +
                '• To search the history of the game: `!history <ATTRIBUTE> <SEARCH VALUE>`\n' +
                '• For help with search or history: `!<COMMAND> help`\n' +
                '• To know who to ~~blame~~give credit to: ~~!blame~~`!credit`\n' +
                'Please feel free to ask an admin for help.');
  }
}