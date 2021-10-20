const Discord = require('discord.js');

module.exports = {  
    name: 'poll',
    aliases: ['vote'],
    description: 'Creates poll',
    usage: 'A question to vote for',
    args: true,
  
    run : async (message, args) => {
      
        let question = args.join(" ");

        const embed = new Discord.RichEmbed()
            .setTitle("A New Voting Has Been Started!")
            .setColor("#5599ff")
            .setDescription(`${question}`)
            .setFooter(`Voting Started By: ${message.author.username}`)
            //.setFooter(`Poll Started By: ${message.author.username}`+ `${message.author.avatarURL}`)


        // emoji source: https://getemoji.com/
        message.channel.send({embed})
        .then(message => {
          message.react('👍')
          message.react('👎')
          //message.react('\U+1F914')
        })
        /*
          const cardNameArg = args.join('').toLowerCase();

          const URLCardName = aliasMap.get(cardNameArg);
          if (URLCardName !== undefined) {
              var cardImageURL = `http://downloads.stormwarsgame.com/cards/${URLCardName}.png`;
              const attachment = new Discord.Attachment(cardImageURL);
              message.channel.send(attachment);
          } else {
              message.channel.send(`Card name "${cardNameArg}" not found. Please check your spelling, or narrow your search terms.`);
          }
          */
    }
}