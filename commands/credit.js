module.exports = {
    name: 'credit',
    aliases: ['credits', 'blame'],
    description: "Tells you about this bot's creators",
    usage: '',
    hidden: true,
  
    run : async (message, args) => {
        await message.channel.send('This bot has been implemented by **fweaks** and **Aleks_Dark**. Please direct your praise and *constructive* critisism their way!');
    }
}