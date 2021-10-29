module.exports = {
    name: 'credit',
    aliases: ['credits', 'blame'],
    description: "Tells you about this bot's creators",
    usage: '',
    hidden: true,
  
    run : async (message, args) => {
        await message.channel.send(
            '*This bot was created/contributed to by:*\n' + 
            'Ongoing Development: **fweaks**\n' + 
            'Development Contributions: **Aleks_Dark**\n' +
            'Data Entry Contributions: **Josher**\n' +
            'Images: **The Devs**\n' +
            '***Please direct your praise and *constructive* criticism their way!***');
    }
}