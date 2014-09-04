/**
 * The page that dispays the results
 */

var async   = require('async');
var fs      = require ('fs');

var resultsController = function(req, res, googleAnalyticsId) {
    'use strict';

    var testId = req.params.testId;
    var resultsPath = 'results/' + testId;
    var phantomasResultsPath = resultsPath + '/results.json';

    console.log('Opening test ' + testId + ' results as HTML');

    async.parallel({
        
        htmlTemplate: function(callback) {
            fs.readFile('./app/node_views/results.html', {encoding: 'utf8'}, callback);
        },

        phantomasMetadata: function(callback) {
            fs.readFile('./node_modules/phantomas/lib/metadata/metadata.json', {encoding: 'utf8'}, callback);
        },

        phantomasResults: function(callback) {
            fs.readFile(phantomasResultsPath, {encoding: 'utf8'}, callback);
        }

    }, function(err, results) {
        if (err) {
            console.log(err);
            return res.status(404).send('Sorry, test not found...');
        }

        var html = results.htmlTemplate;
        html = html.replace('%%METADATA%%', results.phantomasMetadata);
        html = html.replace('%%RESULTS%%', results.phantomasResults);
        html = html.replace('%%GA_ID%%', googleAnalyticsId);

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    });
};

module.exports = resultsController;