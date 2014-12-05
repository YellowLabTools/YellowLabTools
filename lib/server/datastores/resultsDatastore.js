var fs          = require('fs');
var rimraf      = require('rimraf');
var path        = require('path');
var Q           = require('q');


function ResultsDatastore() {
    'use strict';

    var resultFileName = 'results.json';
    var resultsFolderName = 'results';
    var resultsDir = path.join(__dirname, '..', '..', '..', resultsFolderName);


    this.saveResult = function(testResults) {

        var promise = createResultFolder(testResults.runId);

        promise.then(function() {

            var resultFilePath = path.join(resultsDir, testResults.runId, resultFileName);
            
            return Q.nfcall(fs.writeFile, resultFilePath, JSON.stringify(testResults, null, 2));
        });

        return promise;
    };


    this.getResult = function(runId) {

        var resultFilePath = path.join(resultsDir, runId, resultFileName);
        
        return Q.nfcall(fs.readFile, resultFilePath, {encoding: 'utf8'}).then(function(data) {
            return JSON.parse(data);
        });
    };


    this.deleteResult = function(runId) {
        var folder = path.join(resultsDir, runId);

        return Q.nfcall(rimraf, folder);
    };


    // The folder /results/folderName/
    function createResultFolder(folderName) {
        var folder = path.join(resultsDir, folderName);

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