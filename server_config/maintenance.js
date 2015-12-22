var express                 = require('express');
var app                     = express();
var server                  = require('http').createServer(app);

var settings                = require('./settings.json');

app.all('*', function(req, res) {
    res.status(500).send('YellowLabTools is in maintenance. It should come back soon with a new version!');
});

server.listen(settings.serverPort, function() {
    console.log('Maintenance mode started on port %d', server.address().port);
});