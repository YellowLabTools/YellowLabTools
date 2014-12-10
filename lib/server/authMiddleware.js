var config      = require('../../server_config/settings.json');

var jwt         = require('jwt-simple');
var debug       = require('debug')('authMiddleware');


var authMiddleware = function(req, res, next) {
    'use strict';

    if (req.path.indexOf('/api/') === 0) {
        
        // Test if it's an authorized key
        if (req.headers && req.headers['x-api-key'] && isApiKeyValid(req.headers['x-api-key'])) {
            next();
            return;
        }

        // Test if it's an authorized token
        if (req.headers && req.headers['x-api-token'] && isTokenValid(req.headers['x-api-token'])) {
            next();
            return;
        }
        
        res.status(401).send('Unauthorized');
    }
};


function isApiKeyValid(apiKey) {
    return (config.authorizedKeys[apiKey]) ? true : false;
}


function isTokenValid(token) {

    var data = null;

    try {
        data = jwt.decode(token, config.tokenSalt);
    } catch(err) {
        debug('Error while decoding token');
        debug(err);
        return false;
    }

    return data.expire &&
        data.expire > Date.now() &&
        data.application &&
        config.authorizedApplications.indexOf(data.application) >= 0;
}

module.exports = authMiddleware;