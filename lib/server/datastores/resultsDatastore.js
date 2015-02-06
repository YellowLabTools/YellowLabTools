var fs          = require('fs');
var rimraf      = require('rimraf');
var path        = require('path');
var Q           = require('q');
var debug       = require('debug')('ylt:resultsDatastore');


function ResultsDatastore() {
    'use strict';

    var resultFileName = 'results.json';
    var resultScreenshotName = 'screenshot.jpg';
    var resultsFolderName = 'results';
    var resultsDir = path.join(__dirname, '..', '..', '..', resultsFolderName);


    this.saveResult = function(testResults) {
        
        return createResultFolder(testResults.runId)

            .then(function() {
                return saveScreenshotIfExists(testResults);
            })

            .then(function() {

                debug('Saving results to disk...');

                var resultFilePath = path.join(resultsDir, testResults.runId, resultFileName);
                debug('Destination file is %s', resultFilePath);
                
                return Q.nfcall(fs.writeFile, resultFilePath, JSON.stringify(testResults, null, 2));
            });
    };


    this.getResult = function(runId) {

        var resultFilePath = path.join(resultsDir, runId, resultFileName);

        debug('Reading results (runID = %s) from disk...', runId);
        
        return Q.nfcall(fs.readFile, resultFilePath, {encoding: 'utf8'}).then(function(data) {
            return JSON.parse(data);
        });
    };


    this.deleteResult = function(runId) {
        var folder = path.join(resultsDir, runId);

        debug('Deleting results (runID = %s) from disk...', runId);

        return Q.nfcall(rimraf, folder);
    };


    // The folder /results/folderName/
    function createResultFolder(folderName) {
        var folder = path.join(resultsDir, folderName);

        debug('Creating the folder %s', folderName);

        return createGlobalFolder().then(function() {
            return Q.nfcall(fs.mkdir, folder);
        });
    }

    // The folder /results/
    function createGlobalFolder() {
        var deferred = Q.defer();

        // Create the results folder if it doesn't exist
        fs.exists(resultsDir, function(exists) {
            if (exists) {
                deferred.resolve();
            } else {
                debug('Creating the global results folder', resultsDir);
                fs.mkdir(resultsDir, function(err) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                });
            }
        });

        return deferred.promise;
    }

    // If there is a screenshot, save it as screenshot.jpg in the same folder as the results
    function saveScreenshotIfExists(testResults) {
        var deferred = Q.defer();

        if (testResults.screenshotBuffer) {

            var screenshotFilePath = path.join(resultsDir, testResults.runId, resultScreenshotName);
            fs.writeFile(screenshotFilePath, testResults.screenshotBuffer);

            delete testResults.screenshotBuffer;

        } else {
            deferred.resolve();
        }

        return deferred;
    }

    this.getScreenshot = function(runId) {

        var screenshotFilePath = path.join(resultsDir, runId, resultScreenshotName);

        debug('Getting screenshot (runID = %s) from disk...', runId);
        
        return Q.nfcall(fs.readFile, screenshotFilePath);
    };
}

module.exports = ResultsDatastore;