var express                 = require('express');
var app                     = express();
var server                  = require('http').createServer(app);
var bodyParser              = require('body-parser');
var compress                = require('compression');
var cors                    = require('cors');

var authMiddleware          = require('../lib/server/middlewares/authMiddleware');
var apiLimitsMiddleware     = require('../lib/server/middlewares/apiLimitsMiddleware');
var wwwRedirectMiddleware   = require('../lib/server/middlewares/wwwRedirectMiddleware');


// Middlewares
app.use(compress());
app.use(bodyParser.json());
app.use(cors());
app.use(wwwRedirectMiddleware);
app.use(authMiddleware);
app.use(apiLimitsMiddleware);


// Initialize the controllers
var apiController           = require('../lib/server/controllers/apiController')(app);
var frontController         = require('../lib/server/controllers/frontController')(app);


// Let's start the server!
if (!process.env.GRUNTED) {
    var settings = require('../server_config/settings.json');
    server.listen(settings.serverPort, function() {
        console.log('Listening on port %d', server.address().port);

        // For the tests
        if (server.startTests) {
            server.startTests();
        }
    });
}

module.exports = app;