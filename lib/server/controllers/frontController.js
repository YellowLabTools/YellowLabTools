var path = require('path');
var express = require('express');

var FrontController = function(app) {
    'use strict';
 
    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname, '../../../front/src/main.html')); 
    });
    
    app.get('/about', function(req, res) {
        res.sendFile(path.join(__dirname, '../../../front/src/main.html')); 
    });
    
    app.get('/results/:runId', function(req, res) {
        res.sendFile(path.join(__dirname, '../../../front/src/main.html')); 
    });
    
    app.use('/front', express.static(path.join(__dirname, '../../../front/src')));
    app.use('/bower_components', express.static(path.join(__dirname, '../../../bower_components')));
};

module.exports = FrontController;