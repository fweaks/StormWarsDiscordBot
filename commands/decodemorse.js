const Discord = require('discord.js');

const MorseDecoder = {
  '.-'     :'a',
  '-...'   :'b',
  '-.-.'   :'c',
  '-..'    :'d',
  '.'      :'e',
  '..-.'   :'f',
  '--.'    :'g',
  '....'   :'h',
  '..'     :'i',
  '.---'   :'j',
  '-.-'    :'k',
  '.-..'   :'l',
  '--'     :'m',
  '-.'     :'n',
  '---'    :'o',
  '.--.'   :'p',
  '--.-'   :'q',
  '.-.'    :'r',
  '...'    :'s',
  '-'      :'t',
  '..-'    :'u',
  '...-'   :'v',
  '.--'    :'w',
  '-..-'   :'x',
  '-.--'   :'y',
  '--..'   :'z',
  '.----'  :'1',
  '..---'  :'2',
  '...--'  :'3',
  '....-'  :'4',
  '.....'  :'5',
  '-....'  :'6',
  '--...'  :'7',
  '---..'  :'8',
  '----.'  :'9',
  '-----'  :'0',
  '.-.-.-' :'.',
  '--..--' :'' ,
  '..--..' :'?',
  '.----.' :"'",
  '-.-.--' :'!',
  '-..-.'  :'/',
  '-.--.'  :'(',
  '-.--.-' :')',
  '.-...'  :'&',
  '---...' :':',
  '-.-.-.' :';',
  '-...-'  :'=',
  '.-.-.'  :'+',
  '-....-' :'-',
  '..--.-' :'_',
  '.-..-.' :'"',
  '...-..-':'$',
  '.--.-.' :'@',
  '/'      :' ',
  '\n'     :'\n'
};

module.exports = {
    name: 'decodemorse',
    description: 'Decodes morse code to text',
    usage: '<string to encode>',
    hidden: true,
  
    run : async (message, args) => {
        const stringMorse = args.join('').toLowerCase();
        var string = '';
        var cleanStringMorse = stringMorse.replace(/_/g,'-');
        var tokensMorse = cleanStringMorse.split(/ +/);
      
        for(var i = 0; i < tokensMorse.length; i++){
            var cMorse = tokensMorse[i];
            var c = MorseDecoder[cMorse];
            if(c){
                string += c;
            }
        }
      
        await message.channel.send(string);
    }
}