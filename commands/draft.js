module.exports = {
    name: 'draft',
    description: 'gives the draft link',
    usage: '',
    hidden: true,
  
    run : async (message, args) => {
        await message.channel.send("Go here and try it out: https://stormwarsdiscordbot.fweaks.repl.co/draft. NOTE: Yes it's a work in progress and no I'm not responsible for nasal demons");
    }
}