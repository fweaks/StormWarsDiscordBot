const Database = require("@replit/database");
const fetch = require("node-fetch");
const AsyncLock = require("async-lock");

const db = new Database();

var lock = new AsyncLock();
const dataCache = {};

module.exports = {   
   SetLargeObject: async function(key, value, debug = false, cache = true){
        if(debug) { console.log("SetLargeObject"); }

        try {
            if(key === undefined){ throw `key is undefined`; }
            if(value === undefined){ throw `value is undefined`; }

            let t = this;
            let storeFunction = async function() {
                let dataString = JSON.stringify(value);
                await t.SetLargeString(key, dataString, debug, false);
            };

            if (cache === true) {
                await lock.acquire(key, async () => {
                    await storeFunction();
                    dataCache[key] = value;
                });
            } else {
                await storeFunction();
            }

        } catch (error) {
            throw `Failed to SetLargeObject for key "${key}": ${error}`;
        }
    },

    SetLargeString: async function(key, value, debug = false, cache = true){
        let keyString = String(key);
        if(debug) { console.log("SetLargeString"); }

        try {
            if(key === undefined){ throw `key is undefined`; }
            if(value === undefined){ throw `value is undefined`; }

            let storeFunction = async function() {
                let segments = ChunkString(value, 1000);
                console.log(`${segments.length} segments needed for ${keyString}.`)

                let promises = [];
                for(let i = 0; i < segments.length; i++){
                    promises[i] = set(keyString + i, segments[i]);         
                }

                await set(keyString, segments.length);
                await Promise.all(promises);
            };

            if (cache === true) {
                await lock.acquire(key, async () => {
                    await storeFunction();
                    dataCache[key] = value;
                });
            } else {
                await storeFunction();
            }
        } catch (error) {
            throw `Failed to SetLargeString for key "${keyString}": ${error}`;
        }          
    },

    GetLargeObject: async function(key, debug = false, cache = true){
        if(debug) { console.log("GetLargeObject"); }

        let t = this;
        let loadFunction = async function() {
            try{
                var dataString = await t.GetLargeString(key, debug, false);
            } catch (error){
                throw `Failed to GetLargeObject for key "${key}": GetLargeString() Failed: ${error}`
            }
            try{ 
                return JSON.parse(dataString)
            } catch (error) { 
                throw `Failed to GetLargeObject for key "${key}": Failed to parse value, try GetLargeString() to get the raw value: ${error}`
            }
        }

        if(cache === true) {
            return await lock.acquire(key, async () => {
                if(dataCache[key] === undefined) {
                    dataCache[key] = await loadFunction();
                }
                return dataCache[key];
            });
        } else {
            return await loadFunction();
        }        
    },

    GetLargeString: async function(key, debug = false, cache = true){
        var keyString = String(key);
        if(debug) { console.log("GetLargeString"); }

        let loadFunction = async function() {
            try {
                numSegments = await db.get(keyString);
                console.log(`Loading "${keyString}" which is in ${numSegments} segments`) 

                let rawSegments = [];
                let segments = [];
                let promises = [];
                for(let i = 0; i < numSegments; i++){
                    promises[i] = db.get(keyString + i, {raw : true})
                        .catch(error => Promise.reject(`Failed to load from Database for key ${keyString + i} (${keyString} may not be large): ${error}`))
                        .then((value) => { rawSegments[i] = value; segments[i] = value; })
                }

                await Promise.all(promises);
                return segments.join("");
            } catch (error) {
                throw `Failed to GetLargeString for key ${keyString}: ${error}`;
            }
        }
        
        if(cache === true) {
            return await lock.acquire(key, async () => {
                if(dataCache[key] === undefined) {
                    dataCache[key] = await loadFunction();
                }
                return dataCache[key];
            });
        } else {
            return await loadFunction();
        }
    }
}
   
function ChunkString(str, length) {
    if(str === undefined || str === ""){
        return [];
    }else{
        return str.match(new RegExp('.{1,' + length + '}', 'g'));
    }
}

//reimplemented based on the @replit/database
//removed the JSON.stringify because we want to do that before chunking
//also it seems like it was bugged and wasn't using encodeURIComponent even though the github has it
async function set(key, strValue) {
    await fetch(process.env.REPLIT_DB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeURIComponent(key) + "=" + encodeURIComponent(strValue)
    });
}