const Database = require("@replit/database");
const fetch = require("node-fetch");

const db = new Database();

module.exports = {   
   SetLargeObject: function(key, value){
       return Promise.resolve(console.log("SetLargeObject"))
       .then(() => JSON.stringify(value))
       .then(dataString => this.SetLargeString(key, dataString))
       .catch(error => Promise.reject(`Failed to SetLargeObject for key "${key}": ${error}`))
    },

    SetLargeString: function(key, value){
        let keyString = String(key);
        return Promise.resolve(console.log("SetLargeString"))
        .then(() => {
            if(key === undefined){ return Promise.reject(`key is undefined`); }
            if(value === undefined){ return Promise.reject(`value is undefined`); }
            //I wish this could be 1000 (the limit per entry)
            //but it gets JSON stringified again, which adds extra characters
            let segments = ChunkString(value, 1000);
            console.log(`${segments.length} segments needed for ${keyString}.`)

            let promises = [];
            for(let i = 0; i < segments.length; i++){
                promises[i] = set(keyString + i, segments[i]);         
            }

            return set(keyString, segments.length)            
            .then(() => Promise.all(promises))
        })
        .catch(error => Promise.reject(`Failed to SetLargeString for key "${keyString}": ${error}`));            
    },

    GetLargeObject: function(key){
        return Promise.resolve(console.log("GetLargeObject"))
        .then(() => this.GetLargeString(key))
        .then((dataString) => {
            try{ 
                return JSON.parse(dataString) 
            } catch { 
                throw `Failed to parse value of ${key}, try GetLargeString() to get the raw value: ${error}`
            }
        })
        .catch( error => Promise.reject(`Failed to GetLargeObject for key "${keyString}": ${error}`));
    },

    GetLargeString: function(key){
        let keyString = String(key);
        return Promise.resolve(console.log("GetLargeString"))
        .then(() => db.get(keyString))
        .then((numSegments) => {
            console.log(`Loading "${keyString}" which is in ${numSegments} segments`) 

            let rawSegments = [];
            let segments = [];
            let promises = [];
            for(let i = 0; i < numSegments; i++){
                promises[i] = db.get(keyString + i, {raw : true})
                    .catch(error => Promise.reject(`Failed to load from Database for key ${keyString + i} (${keyString} may not be large): ${error}`))
                    .then((value) => { rawSegments[i] = value; segments[i] = value; })
            }

            return Promise.all(promises)
            .then(() => segments.join(""));
        })
        .catch(error => Promise.reject(`Failed to GetLargeString for key ${keyString}: ${error}`));
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