var config      = require('../../../server_config/settings.json');

var debug       = require('debug')('authMiddleware');


var authMiddleware = function(req, res, next) {
    'use strict';

    if (req.path.indexOf('/api/') === 0) {
        
        
        if (req.headers && req.headers['x-api-key']) {

            // Test if it's an authorized key
            if (isApiKeyValid(req.headers['x-api-key'])) {
                
                // Come in!
                debug('Authorized key: %s', req.headers['x-api-key']);
                res.locals.hasApiKey = true;
            
            } else {
                
                // Sorry :/
                debug('Unauthorized key %s', req.headers['x-api-key']);
                res.status(401).send('Unauthorized');
                return;
            }
        } else {
            debug('No authorization key');
            // It's ok for the moment but you might be blocked by the apiLimitsMiddleware, dude
        }
    }

    next();
};


function isApiKeyValid(apiKey) {
    return (config.authorizedKeys[apiKey]) ? true : false;
}

module.exports = authMiddleware;