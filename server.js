// Config file
var settings                = require('./server_config/settings.json');

// Libraries
var fs                      = require('fs');
var async                   = require('async');
var express                 = require('express');
var app                     = express();
var server                  = require('http').createServer(app);
var io                      = require('socket.io').listen(server);
var bodyParser              = require('body-parser');
var compress                = require('compression');

// Internals
var indexController         = require('./app/node_controllers/indexController');
var launchTestController    = require('./app/node_controllers/launchTestController');
var resultsController       = require('./app/node_controllers/resultsController');
var waitingQueueSocket      = require('./app/node_controllers/waitingQueueSocket');
var testQueue               = require('./app/lib/testQueue');

app.use(compress());
app.use(bodyParser.urlencoded({ extended: false }));


// Redirect www.yellowlab.tools to yellowlab.tools (for SEO)
app.all('*', function(req, res, next) {
    if (req.hostname && req.hostname.match(/^www\.yellowlab\.tools/) !== null) {
        res.redirect('http://' + req.hostname.replace(/^www\.yellowlab\.tools/, 'yellowlab.tools') + req.url);
    } else {
        next();
    }
});

// Routes definition
app.get('/',                    function(req, res) { indexController(req, res, settings.googleAnalyticsId); });
app.post('/launchTest',         function(req, res) { launchTestController(req, res, testQueue, settings.googleAnalyticsId); });
app.get('/results/:testId',     function(req, res) { resultsController(req, res, settings.googleAnalyticsId); });


// Static files
app.use('/public',              express.static(__dirname + '/app/public'));
app.use('/bower_components',    express.static(__dirname + '/bower_components'));


// Socket.io
io.on('connection', function(socket){
    waitingQueueSocket(socket, testQueue);
});

// Create the results folder if it doesn't exist
var resultsPath = 'results';
if (!fs.existsSync(resultsPath)) {
    fs.mkdirSync(resultsPath);
}

// Launch the server
server.listen(settings.serverPort, function() {
    console.log('Listening on port %d', server.address().port);
});