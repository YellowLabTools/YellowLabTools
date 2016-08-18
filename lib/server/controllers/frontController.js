var path        = require('path');
var express     = require('express');

var FrontController = function(app) {
    'use strict';

    var cacheDuration = 365 * 24 * 60 * 60 * 1000; // One year
    var assetsPath = (app.get('env') === 'development') ? '../../../front/src' : '../../../front/build';

    // Routes templating    
    var routes = ['/', '/about', '/result/:runId', '/result/:runId/timeline', '/result/:runId/screenshot', '/result/:runId/rule/:policy', '/queue/:runId'];

    routes.forEach(function(route) {
        app.get(route, function(req, res) {
            res.setHeader('Cache-Control', 'public, max-age=20');
            res.render(path.join(__dirname, assetsPath, 'main.html'), {
                baseUrl: app.locals.baseUrl
            });
        });
    });

    // Views templating
    app.get('/views/:viewName', function(req, res) {
        res.setHeader('Cache-Control', 'public, max-age=' + cacheDuration);
        res.render(path.join(__dirname, assetsPath, 'views/' + req.params.viewName), {
            baseUrl: app.locals.baseUrl
        });
    });
    
    // Static assets
    app.use('/css', express.static(path.join(__dirname, assetsPath, 'css'), { maxAge: cacheDuration }));
    app.use('/fonts', express.static(path.join(__dirname, assetsPath, 'fonts'), { maxAge: cacheDuration }));
    app.use('/img', express.static(path.join(__dirname, assetsPath, 'img'), { maxAge: cacheDuration }));
    app.use('/js', express.static(path.join(__dirname, assetsPath, 'js'), { maxAge: cacheDuration }));
    app.use('/node_modules', express.static(path.join(__dirname, '../../../node_modules'), { maxAge: cacheDuration }));
};

module.exports = FrontController;