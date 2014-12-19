var fs          = require('fs');
var rimraf      = require('rimraf');
var path        = require('path');
var Q           = require('q');
var debug       = require('debug')('ylt:resultsDatastore');


function ResultsDatastore() {
    'use strict';

    var resultFileName = 'results.json';
    var resultsFolderName = 'results';
    var resultsDir = path.join(__dirname, '..', '..', '..', resultsFolderName);


    this.saveResult = function(testResults) {
        var promise = createResultFolder(testResults.runId);

        debug('Saving results to disk...');

        promise.then(function() {

            var resultFilePath = path.join(resultsDir, testResults.runId, resultFileName);
            debug('Destination file is %s', resultFilePath);
            
            return Q.nfcall(fs.writeFile, resultFilePath, JSON.stringify(testResults, null, 2));
        });

        return promise;
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
}

module.exports = ResultsDatastore;