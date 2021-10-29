const { HelpMessage } = require('../strings.js')

module.exports = {
    name: 'help',
    description: 'Gives help',
    usage: '',
    cooldown: 5,
  
    run : async (message, args) => {
        message.channel.send(
            'Hello, thanks for using the C&C Cardbot!\n' +
            '• For cards use: `!card CARD NAME`\n' +
            '• For abilities use: `!ability ABILITY NAME`\n' +
            //'• For heroes use: !hero HERO NAME\n' +
            '• To search the database use: `!search [ATTRIBUTE] SEARCH VALUE`\n' +
            '• For help with search use: `!search help`\n' +
            '• To know who to ~~blame~~give credit to: ~~!blame~~`!credit`\n' +
            'Please feel free to ask an admin or moderator for known keywords.'
        );
    }
}