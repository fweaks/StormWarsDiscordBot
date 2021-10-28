const DbEx = require('../common/DbExtensions.js');
const { CARD_SEARCH_PATH } = require('../strings.js'); 
const ImageHandler = require('../common/CardImageHandler.js');
const AsyncLock = require("async-lock");
const v8 = require('v8');

const VERSION = '0';
const MIN_HASH_LENGTH = 10;
const RARITIES = ['C', 'U', 'R', 'E', 'L'];
const RARITIES_REVERSED = {C:0,U:1,R:2,E:3,L:4}
const FACTIONS = ['A','E','D','O','S','H','X'];
//const FACTIONS_REVERSED = {C:0,U:1,R:2,E:3,L:4}
const SETS = ['core','dragons','frontiers','crew','reliquary','developer','soulbound'];
const defaultPickOrder = 'CURCURCURECURELUREURELURE';

const DECK_SIZE = 25;
const NUM_CHOICES = 4;

const lock = new AsyncLock();
let draftCollection;

lock.acquire('reparse', reparse);

module.exports = function(expressApp) {
    expressApp.get('/draft', (request, response) => {
        console.log('received draft');
        response.sendFile(__dirname + '/draftoptions.html');
    });

    expressApp.get('/drafting.css', (request, response) => {
        response.sendFile(__dirname + '/drafting.css');
    })
    expressApp.get('/drafting', (request, response) => {
        console.log('received drafting');
        console.log(request.query);
        if (!request.query.hash 
            && !request.query.rarity 
            && !request.query.faction 
            && !request.query.pickOrder 
            && !request.query.set) { return response.redirect('/draft'); }

        lock.acquire('reparse', () => { DraftingHandler(request, response); });
    });
    
    expressApp.get('/draftend.css', (request, response) => {
        response.sendFile(__dirname + '/draftend.css');
    })
    expressApp.get('/draftend', (request, response) => {
        console.log('received draftend');
        console.log(request.query);
        if(Object.keys(request.query).length === 0) { return response.redirect('/draft'); }

        lock.acquire('reparse', () => { DraftEndHandler(request, response); } );
    });

    console.log('Finished Draft Setup')
}

function DraftingHandler(request, response) {
    let model = {};
    let matchingCards = draftCollection;

    if (typeof(request.query.hash) === 'string' && request.query.hash.length >= MIN_HASH_LENGTH) {
        let version = request.query.hash[0]
        let bitField = parseInt(ConvertBase(request.query.hash.substring(1,4), 64, 10)); // 0 and NaN are invalid results
        let seed = parseInt(ConvertBase(request.query.hash.substring(4,10), 64, 10)); // NaN is an invalid result, 0 is not
        let pickOrderPreHash = ConvertBase(request.query.hash.substring(10), 64, 5); // null is an invalid result
        
        if (version !== VERSION || !bitField || seed === NaN || !pickOrderPreHash) {
            console.log({version:version, bitField:bitField, seed:seed, pickOrderPreHash:pickOrderPreHash});
            return response.redirect('/draft');
        }

        let selections = SelectionFromBitField(bitField, FACTIONS.concat(SETS));
        model.factions = selections.slice(0,FACTIONS.length);
        model.sets = selections.slice(FACTIONS.length);
        model.pickOrder = '';
        for (let i = 1/*skip the leading '1'*/; i < pickOrderPreHash.length; i++) {
            model.pickOrder += RARITIES[parseInt(pickOrderPreHash[i])];
        }
        
        var RNG;
        [RNG, model.seed] = CreatePRNG(seed);

        model.hash = request.query.hash;
        console.log(model);
    } else {
        //parse pickorder
        model.pickOrder = '';
        if (request.query.pickOrder === 'CUSTOM' && typeof(request.query.customPickOrder) === 'string') {
            model.pickOrder = request.query.customPickOrder.replace(/[^CUREL]/g,'');        
        } else if (typeof(request.query.pickOrder) === 'string') {
            model.pickOrder = request.query.pickOrder.replace(/[^CUREL]/g,'');        
        }
        if(model.pickOrder === ''){
            model.pickOrder = defaultPickOrder;        
        }
        
        //parse and filter Factions
        if (!request.query.faction || typeof(request.query.faction) !== 'object') {
            model.factions = FACTIONS;
        } else {
            model.factions = FACTIONS.map(f => request.query.faction[f] === 'true' ? f : undefined);

            if (model.factions.filter(f => f !== undefined).length === 0) {
                model.factions = FACTIONS;
            } else {

            }
        }

        //parse and filter Sets
        if (!request.query.set || typeof(request.query.set) !== 'object') { 
            model.sets = SETS;
        } else {
            model.sets = SETS.map(s => request.query.set[s] === 'true' ? s : undefined);
            
            if (model.sets.filter(s => s !== undefined).length === 0) {
                model.sets = SETS;
            } else {

            }
        }

        //use a seedable PRNG so that we can replicate on another request
        var RNG;
        [RNG, model.seed] = CreatePRNG();

        //Create the 'hash'
        model.hash = VERSION;
        model.hash += ConvertBase('' + SelectionToBitField(model.factions.concat(model.sets)), 10, 64).padStart(3,'0');
        model.hash += ConvertBase('' + model.seed, 10, 64).padStart(6, '0');
        //compress the pickorder by translating it to a base 5 number then converting it to base 64
        let preHash = '1' //make sure there are no leading 0s as this is not a normal number, rather a string masquerading as a number
        for (let pickNum=0; pickNum < model.pickOrder.length; pickNum++) {
            preHash += RARITIES_REVERSED[model.pickOrder[pickNum]];
        }
        model.hash += ConvertBase(preHash, 5, 64);
        
        console.log(model);
    }

    let filterObject = {};
    model.factions.filter(f => f !== undefined).forEach(f => filterObject[f] = true);
    matchingCards = matchingCards.filter(c => filterObject[c.FACTION] === true);

    filterObject = {};
    model.sets.filter(s => s !== undefined).forEach(s => filterObject[s] = true);
    matchingCards = matchingCards.filter(c => filterObject[c.SET] === true);

    if(matchingCards.length === 0 ){return response.redirect('/draft');}

    //group rarities into separate selection pools
    rarityPools = {};
    RARITIES.forEach(r => {
        rarityPools[r] = { cards: matchingCards.filter(c => c.RARITY === r) };
        rarityPools[r].poolSize = rarityPools[r].cards.length;
    });

    //for each pick in the pick order, pick 4 cards at random (without replacement) from the corresponding rarity pool
    model.picks = [];
    for (let pickNum=0; pickNum < model.pickOrder.length; pickNum++) {
        //Pick a card
        let pick = {pickNum: pickNum, cards:[]};
        let rarityPool = rarityPools[model.pickOrder[pickNum]];
        for (let i=0; i < Math.min(NUM_CHOICES, rarityPool.poolSize); i++) {
            let randomIndex = Math.floor(RNG() * (rarityPool.poolSize - i));//-i to exclude duplicates (see swap below)
            pick.cards[i] = rarityPool.cards[randomIndex];
            if(rarityPool.poolSize - i > 1){
                //swap the chosen one with the end so that we can select without duplicates
                [rarityPool.cards[randomIndex], rarityPool.cards[rarityPool.poolSize-1-i]] = [rarityPool.cards[rarityPool.poolSize-1-i], rarityPool.cards[randomIndex]];
            }
        }
        model.picks[pickNum] = pick;
    }

    response.send(DraftingRender(model));
};

function DraftingRender(model) {
    let link = 'https://StormWarsDiscordBot.fweaks.repl.co/drafting?hash=' + encodeURIComponent(model.hash);
    let responseString = '<head>' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<link rel="stylesheet" href="/drafting.css">' +
    '</head><body>' +
    '<div>' +
        `<p>You Requested the pick order: ${model.pickOrder}.</p>` +
        `<p>You Requested the factions: ${SelectionToString(model.factions)}.</p>` +
        `<p>You Requested the sets: ${SelectionToString(model.sets)}.</p>` +
        `<p>To share this exact draft shown below, copy this link: <a href="${link}">${link}</a></p>` +
    '</div>' + 
    '<form action="draftend">' + 
        `<input type="hidden" name="hash" value="${model.hash}"/>` + 
        '<div class="divider"><hr/></div>';

    for (let pick of model.picks) {
        responseString += '<div class="pick">';
        for (let card of pick.cards) {
            responseString += '<label>' +
                `<input type="radio" name="p${pick.pickNum}" value="${card.ID}"/>` +
                `<img src="${ImageHandler.CardImageURL(card.URLCardName)}"/>` +
                '<div class="highlight"></div>' + 
            '</label>';
        }
        responseString += '</div>' +
        '<div class="divider"><hr/></div>';
    }

    responseString += '<input type="submit"/>' + 
    '</form></body>';

    return responseString;
}

function DraftEndHandler(request, response){
    let model = {};

    if (typeof(request.query.hash) === 'string' && request.query.hash.length >= MIN_HASH_LENGTH) {
        model.hash = request.query.hash;
    }

    if (request.query.idhash && typeof(request.query.idhash) === 'string') {
        let version = request.query.idhash[0];
        let idsPreHash = ConvertBase(request.query.idhash.substring(1), 64, 8);
        if(version !== VERSION || !idsPreHash) {
            if (model.hash) {
                return response.redirect('/drafting?hash=' + encodeURIComponent(model.hash)); 
            } else {
                return response.redirect('/draft');
            }
        }

        var ids = [];
        for (let i = 0,pos = 1/*skip the leading '1'*/; pos < idsPreHash.length; i++,pos+=3) {
            ids[i] = parseInt(ConvertBase(idsPreHash.substring(pos, pos+3), 8, 10));
        }

        model.idhash = request.query.idhash;
    } else {
        var ids = Object.keys(request.query).filter(k => k.startsWith('p')).map(k => parseInt(request.query[k])).filter(id=>id !== NaN);    
        if(ids.length === 0) { 
            if (model.hash) {
                return response.redirect('/drafting?hash=' + encodeURIComponent(model.hash)); 
            } else {
                return response.redirect('/draft');
            }
        }

        let idsPreHash = '1';//make sure there are no leading 0s as this is not a normal number, rather a bunch of length delimited numbers in a trenchcoat
        for (let id of ids) {
            idsPreHash += ConvertBase('' + id, 10, 8).padStart(3,'0')
        }
        model.idhash = VERSION + ConvertBase(idsPreHash, 8, 64);
    }
    console.log(ids);
    model.CDPools = [];
    for (let id of ids){
        let card = draftCollection[id];
        if (card){
            if (model.CDPools[card.TIME]) {
                model.CDPools[card.TIME].push(card);
            } else {
                model.CDPools[card.TIME] = [card];
            }
        }
    }

    for (let pool of model.CDPools) {
        if (pool) {
            pool.sort(CardAttributeSorter(c => c.FACTION, c => c.CARDNAME));
        }
    }

    response.send(DraftEndRender(model));
}

function DraftEndRender(model) {
    responseString = '<head>' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<link rel="stylesheet" href="/draftend.css">' +
    '</head><body>' +
    '<div>';
    if (model.hash) {
        let link = 'https://StormWarsDiscordBot.fweaks.repl.co/drafting?hash=' + encodeURIComponent(model.hash);
        responseString += `<p>To redo the exact same draft/share it with others, use/copy this link: <a href="${link}">${link}</a></p>`;
    }
    if (model.idhash) {
        let link = 'https://StormWarsDiscordBot.fweaks.repl.co/draftend?idhash=' + encodeURIComponent(model.idhash)
        if (model.hash) { link  += '&hash=' + encodeURIComponent(model.hash); }
        responseString += `<p>To share this result page (or save it for later), copy this link:  <a href="${link}">${link}</a></p>`;
    }
    responseString += '</div>' +
    '<div class="draft-layout">';

    for (let pool of model.CDPools) {
        if (pool) {
            responseString += '<div class="pool">';
            for (let card of pool) {
                responseString += `<div class="card"><img src="${ImageHandler.CardImageURL(card.URLCardName)}"/></div>`;
            }
            responseString += '</div>';
        }
    }    
    responseString += '</div></body>';

    return responseString;
}

//creates a comparator function used to sort arrays of cards based on 1 or more attributes
//takes 1 or more functions which each select a relevant attribute
function CardAttributeSorter(...getAttributeFunctions) {
    return function(c1, c2){
        for (let i = 0; i < getAttributeFunctions.length; i++) {
            a1 = getAttributeFunctions[i](c1);
            a2 = getAttributeFunctions[i](c2);
            if (a1 < a2) {
                return -1;
            }
            if (a1 > a2) {
                return 1;
            }
        }
        return 0;
    }
}
async function reparse(debug = false){
    console.log("reparse Draft Setup");
    try{
        const originalDraftCards = await DbEx.GetLargeObject(CARD_SEARCH_PATH, debug);

        console.log("rebuilding Draft Setup");

        let draftCards = v8.deserialize(v8.serialize(originalDraftCards));//deep copy
        draftCards.sort(CardAttributeSorter(c=>c.CARDNAME));
        draftCollection = [];
        let identity = 0;

        for (let card of draftCards) {
            card.ID = identity;
            identity++

            card.SET = card.SET.replace(/ +/g,'').toLowerCase();
            card.RARITY = card.RARITY.replace(/ +/g,'').toUpperCase();
            card.FACTION = card.FACTION.replace(/ +/g,'').toUpperCase();
            card.URLCardName = card.CARDNAME.toLowerCase().replace(/ +/g,'_');
        
            draftCollection[card.ID] = card;
        }

        console.log(`finished rebuilding Draft Setup`);
    } catch(error) {
        console.log(error);
    }
};

//a PRNG that can be seeded from here https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function CreatePRNG(seed = undefined){
    if(seed === undefined){        
        seed = Math.floor(Math.random() * 4294967296);
    }
    return [Mulberry32PRNG(seed), seed];
}

function Mulberry32PRNG(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

//expects an array of non-empty strings and/or undefined/falsey values
function SelectionToString(selectionArray) {
    let selectedOptions = selectionArray.filter(x => x);
    if(selectedOptions.length > 0){
        return selectedOptions.reduce((x1, x2) => x1 + ',' + x2);
    } else {
        return "None";
    }
}

//expects an array of non-empty strings and/or undefined/falsey values
function SelectionToBitField(selectionArray) {
    let bitField = 0;
    for (let i = 0; i < selectionArray.length; i++) {
        if (selectionArray[i]) { bitField |= (1 << i); }
    }
    return bitField;
}

function SelectionFromBitField (bitField, options) {
    let selections = [];
    for (let i = 0; i < options.length ; i++) {
        selections[i] = ((bitField & (1 << i)) ? options[i] : undefined);
    }
    return selections;
}

function ConvertBase(str, fromBase, toBase) {

    const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

    const add = (x, y, base) => {
        let z = [];
        const n = Math.max(x.length, y.length);
        let carry = 0;
        let i = 0;
        while (i < n || carry) {
            const xi = i < x.length ? x[i] : 0;
            const yi = i < y.length ? y[i] : 0;
            const zi = carry + xi + yi;
            z.push(zi % base);
            carry = Math.floor(zi / base);
            i++;
        }
        return z;
    }

    const multiplyByNumber = (num, x, base) => {
        if (num < 0) return null;
        if (num == 0) return [];

        let result = [];
        let power = x;
        while (true) {
            num & 1 && (result = add(result, power, base));
            num = num >> 1;
            if (num === 0) break;
            power = add(power, power, base);
        }

        return result;
    }

    const parseToDigitsArray = (str, base) => {
        const digits = str.split('');
        let arr = [];
        for (let i = digits.length - 1; i >= 0; i--) {
            const n = DIGITS.indexOf(digits[i])
            if (n == -1) return null;
            arr.push(n);
        }
        return arr;
    }

    const digits = parseToDigitsArray(str, fromBase);
    if (digits === null) return null;

    let outArray = [];
    let power = [1];
    for (let i = 0; i < digits.length; i++) {
        digits[i] && (outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase));
        power = multiplyByNumber(fromBase, power, toBase);
    }

    let out = '';
    for (let i = outArray.length - 1; i >= 0; i--)
        out += DIGITS[outArray[i]];

    return out;
}