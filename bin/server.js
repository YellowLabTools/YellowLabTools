// Config file
var settings                = require('../server_config/settings.json');

var express                 = require('express');
var app                     = express();
var server                  = require('http').createServer(app);
var bodyParser              = require('body-parser');
var compress                = require('compression');

app.use(compress());
app.use(bodyParser.json());


// Initialize the controllers
var apiController           = require('../lib/server/controllers/apiController')(app);
var uiController            = require('../lib/server/controllers/uiController')(app);


// Launch the server
server.listen(settings.serverPort, function() {
    console.log('Listening on port %d', server.address().port);
});