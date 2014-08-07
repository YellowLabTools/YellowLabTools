/**
 * Yellow Lab Tools home page controller
 */

var async   = require('async');
var fs      = require ('fs');

var indexController = function(req, res) {
    'use strict';

    async.parallel({
        
        htmlTemplate: function(callback) {
            fs.readFile('./app/node_views/index.html', {encoding: 'utf8'}, callback);
        }

    }, function(err, results) {
        res.setHeader('Content-Type', 'text/html');
        res.send(results.htmlTemplate);
    });
 };

 module.exports = indexController;