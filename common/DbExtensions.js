const Database = require("@replit/database");
const fetch = require("node-fetch");

const db = new Database();

module.exports = {   
   SetLargeObject: async function(key, value, debug = false){
        if(debug) { console.log("SetLargeObject"); }

        try {
            let dataString = JSON.stringify(value);
            return await this.SetLargeString(key, dataString);
        } catch (error) {
            throw `Failed to SetLargeObject for key "${key}": ${error}`;
        }
    },

    SetLargeString: async function(key, value, debug = false){
        let keyString = String(key);
        if(debug) { console.log("SetLargeString"); }

        try {
            if(key === undefined){ throw `key is undefined`; }
            if(value === undefined){ throw `value is undefined`; }

            let segments = ChunkString(value, 1000);
            console.log(`${segments.length} segments needed for ${keyString}.`)

            let promises = [];
            for(let i = 0; i < segments.length; i++){
                promises[i] = set(keyString + i, segments[i]);         
            }

            await set(keyString, segments.length);
            return Promise.all(promises);
        } catch (error) {
            throw `Failed to SetLargeString for key "${keyString}": ${error}`;
        }          
    },

    GetLargeObject: async function(key, debug = false){
        if(debug) { console.log("GetLargeObject"); }

        try{
            var dataString = await this.GetLargeString(key);
        } catch (error){
            throw `Failed to GetLargeObject for key "${key}": ${error}`
        }
        try{ 
            return JSON.parse(dataString)
        } catch (error) { 
            throw `Failed to GetLargeObject for key "${key}": Failed to parse value, try GetLargeString() to get the raw value: ${error}`
        }
    },

    GetLargeString: async function(key, debug = false){
        var keyString = String(key);
        if(debug) { console.log("GetLargeString"); }

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