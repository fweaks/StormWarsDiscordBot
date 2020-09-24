
module.exports = {
    trigger: 'ready',
  
    run : async (client) => {
        // List all servers the bot is connected to
        console.log("Servers:")
        client.guilds.cache.forEach((guild) => {
            console.log(" - " + guild.name)
        })
    }
}