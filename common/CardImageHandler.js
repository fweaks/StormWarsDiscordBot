const Discord = require('discord.js');
const fetch = require("node-fetch");

module.exports = {  
    CardImageURL: function (URLCardName) { return `https://raw.githubusercontent.com/Josher94/CardsandCastles/master/${URLCardName}.PNG`; },

    GetImageAttachment: function(URLCardName){
        return new Promise((Resolve, Reject) => {
            var cardImageURL = this.CardImageURL(URLCardName);
            fetch(cardImageURL)
            .then((res) => { 
                if (res.ok) {
                    Resolve(new Discord.MessageAttachment(cardImageURL)); 
                } else {
                    Reject("url returned " + res.status + ": " + res.statusText)
                }   
            })
            .catch((err) => Reject(err));
        });
    }
}