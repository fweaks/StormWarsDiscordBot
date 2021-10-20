
const rarities = ['C', 'U', 'R', 'E', 'L'];
const factions = ['A','E','D','O','S','H','X']

module.exports = function(expressApp) {
    expressApp.get('/draft', function(request, response) {
        response.sendFile(__dirname + '/draftoptions.html');
    });

    expressApp.get('/drafting', function(request, response) {
        console.log(request.query);
        if (!request.query.rarity && !request.query.faction) { response.sendFile(__dirname + '/draftoptions.html'); return; }

        if (!request.query.rarity || typeof(request.query.rarity) !== 'object') { 
            var rarityString = 'CUREL';
        } else {
            var rarityString = rarities.filter(r => request.query.rarity[r] === 'true')
                                   .reduce((r1, r2) => r1 + ',' + r2);
            if (rarityString === '') { rarityString = 'CUREL'; }
        }

        if (!request.query.faction || typeof(request.query.faction) !== 'object') { 
            var factionString = 'AEDOSHX'
        } else {
            var factionString = factions.filter(f => request.query.faction[f] === 'true')
                                    .reduce((f1, f2) => f1 + ',' + f2);
            if (factionString === '') { factionString = 'AEDOSHX'; }
        }

        if (rarityString + factionString == '') { response.sendFile(__dirname + '/draftoptions.html'); return; }
    
        responseString = '<div>' +
            '<p>You Requested the rarities: ' + rarityString + '</p>' +
            '<p>You Requested the factions: ' + factionString + '</p>' +
        '</div>';

        response.send(responseString);

    });

    console.log('Finished Draft Setup')
}