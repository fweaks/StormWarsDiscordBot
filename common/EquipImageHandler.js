const Discord = require('discord.js');
const fetch = require("node-fetch");

module.exports = {        
    GetImageAttachment: function(URLEquipName){
        return new Promise((Resolve, Reject) => {
            var cardImageURL = `https://d3f7do5p5ldf15.cloudfront.net/Discord/equips/${URLEquipName}.png`;
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