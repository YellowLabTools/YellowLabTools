var path = require('path');
var express = require('express');

var FrontController = function(app) {
    'use strict';
    
    var routes = ['/', '/about', '/result/:runId', '/result/:runId/timeline', '/result/:runId/rule/:policy', '/queue/:runId'];
    
    routes.forEach(function(route) {
        app.get(route, function(req, res) {
            res.sendFile(path.join(__dirname, '../../../front/src/main.html')); 
        });
    });
    
    app.use('/front', express.static(path.join(__dirname, '../../../front/src')));
    app.use('/bower_components', express.static(path.join(__dirname, '../../../bower_components')));
};

module.exports = FrontController;