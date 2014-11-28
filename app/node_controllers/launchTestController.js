/**
 * Controller for the test launching page (the waiting page, after the user submited a test on the index page)
 */

var async           = require('async');
var fs              = require ('fs');
var strReplace      = require('../lib/strReplace');

var launchTestController = function(req, res, testQueue, googleAnalyticsId) {
    'use strict';

    var resultsPath = 'results/' + testId;
    var phantomasResultsPath = resultsPath + '/results.json';
    
    var url = req.body.url;

    var options = {};
    if (req.body.timeout) {
        options.timeout = req.body.timeout;
    }

    async.waterfall([
        
        function htmlTemplate(callback) {
            fs.readFile('./app/node_views/launchTest.html', {encoding: 'utf8'}, callback);
        },

        function sendResponse(html, callback) {

            html = strReplace(html, '%%TEST_URL%%', url);
            html = strReplace(html, '%%TEST_ID%%', testId);
            html = strReplace(html, '%%GA_ID%%', googleAnalyticsId);

            res.setHeader('Content-Type', 'text/html');
            res.send(html);

            callback();
        },

        function createFolder(callback) {
            // Create results folder
            fs.mkdir(resultsPath, callback);
        },

        function executePhantomas(callback) {
            console.log('Adding test ' + testId + ' on ' + url + ' to the queue');
            
            var task = {
                testId: testId,
                url: url,
                options: options
            };

            testQueue.push(task, callback);
        },

        function writeResults(json, resultsObject, callback) {
            console.log('Saving Phantomas results file to ' + phantomasResultsPath);
            fs.writeFile(phantomasResultsPath, JSON.stringify(json, null, 4), callback);
        }

    ], function(err) {
        if (err) {
            console.log('An error occured in the phantomas test: ', err);

            fs.writeFile(phantomasResultsPath, JSON.stringify({url: url, error: err}, null, 4), function(err) {
                if (err) {
                    console.log('Could not even write an error message on file ' + phantomasResultsPath);
                    console.log(err);
                }
            });
            testQueue.testFailed(testId);
        } else {
            testQueue.testComplete(testId);
        }
    });
 };

 module.exports = launchTestController;