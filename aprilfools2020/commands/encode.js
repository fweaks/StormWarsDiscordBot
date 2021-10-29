const Discord = require('discord.js');

const MorseEncoder = {
  'a': '.-',
  'b': '-...',
  'c': '-.-.',
  'd': '-..',
  'e': '.',
  'f': '..-.',
  'g': '--.',
  'h': '....',
  'i': '..',
  'j': '.---',
  'k': '-.-',
  'l': '.-..',
  'm': '--',
  'n': '-.',
  'o': '---',
  'p': '.--.',
  'q': '--.-',
  'r': '.-.',
  's': '...',
  't': '-',
  'u': '..-',
  'v': '...-',
  'w': '.--',
  'x': '-..-',
  'y': '-.--',
  'z': '--..',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '0': '-----',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  '_': '..--.-',
  '"': '.-..-.',
  '$': '...-..-',
  '@': '.--.-.',
  ' ': ' /',
  '\n':'\n'
}

var localEncode = function (string) {
        var stringMorse = '';
      
        for(var i = 0; i < string.length; i++){
            var c = string.charAt(i).toLowerCase();
            var cMorse = MorseEncoder[c];
            if(cMorse){
                stringMorse += cMorse;
            }
            stringMorse += ' ';
        }
        return stringMorse;
    };

module.exports = {
    name: 'encode',
    description: 'Encodes text as morse code',
    usage: '<string to encode>',
    hidden: true,
  
    Encode : function (string) {
        var stringMorse = '';
      
        for(var i = 0; i < string.length; i++){
            var c = string.charAt(i).toLowerCase();
            var cMorse = MorseEncoder[c];
            if(cMorse){
                stringMorse += cMorse;
            }
            stringMorse += ' ';
        }
        return stringMorse;
    },
  
    run : async (message, args) => {      
        const string = args.join('').toLowerCase();      
        const stringMorse = localEncode(string);
        await message.channel.send(stringMorse);
    }
}