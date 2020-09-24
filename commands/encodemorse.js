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

module.exports = {
    name: 'decodemorse',
    description: 'Encodes text as morse code',
    usage: '<string to encode>',
    hidden: true,
  
    run : async (message, args) => {      
        const string = args.join('').toLowerCase();
      
        var stringMorse = '';

        for(var i = 0; i < string.length; i++){
            var c = string.charAt(i).toLowerCase();
            var cMorse = MorseEncoder[c];
            if(cMorse){
                stringMorse += cMorse;
            }
            stringMorse += ' ';
        }

        await message.channel.send(stringMorse);
    }
}