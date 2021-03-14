const Q           = require('q');
const debug       = require('debug')('ylt:resultsDatastore');
const path        = require('path');
const AWS         = require('aws-sdk');


function ResultsDatastore() {
    'use strict';

    const serverSettings = require('../../../server_config/settings.json');
    
    const s3 = new AWS.S3();

    const resultFileName = 'results.json';
    const resultScreenshotName = 'screenshot.jpg';
    const resultsFolderName = 'results';


    this.saveResult = function(testResults) {
        const resultFilePath = path.join(resultsFolderName, testResults.runId, resultFileName);
        const screenshotFilePath = path.join(resultsFolderName, testResults.runId, resultScreenshotName);

        debug('Starting to save screenshot then results.json file on s3...');

        return saveScreenshotIfExists(testResults, screenshotFilePath)

        .then(function() {
            debug('Saving results file to s3, destination is %s', resultFilePath);
            return s3PutObject(resultFilePath, JSON.stringify(testResults, null, 2));
        });
    };


    this.getResult = function(runId) {
        const resultFilePath = path.join(resultsFolderName, runId, resultFileName);
        debug('Reading results (runID = %s) from AWS s3...', runId);
        return s3GetObject(resultFilePath).then(function(bodyBuffer) {
            return JSON.parse(bodyBuffer.toString('utf-8'));
        });
    };


    // If there is a screenshot, save it as screenshot.jpg in the same folder as the results
    function saveScreenshotIfExists(testResults, imagePath) {
        var deferred = Q.defer();

        if (testResults.screenshotBuffer) {
            s3PutObject(imagePath, testResults.screenshotBuffer)
            
            .fail(function() {
                debug('Image %s could not be saved on s3. Ignoring.', imagePath);
            })
            
            .finally(function() {
                delete testResults.screenshotBuffer;
                deferred.resolve();
            });

        } else {
            debug('Screenshot not found');
            deferred.resolve();
        }

        return deferred.promise;
    }


    this.getScreenshot = function(runId) {
        const screenshotFilePath = path.join(resultsFolderName, runId, resultScreenshotName);
        debug('Retrieving screenshot (runID = %s) from s3...', runId);
        return s3GetObject(screenshotFilePath);
    };


    function s3PutObject(path, body, ignoreError) {
        var deferred = Q.defer();

        s3.putObject({
            Bucket: serverSettings.awsHosting.s3.bucket,
            Key: path,
            Body: body
        }, function(err, data) {
            if (err) {
                debug('Could not save file %s on s3', path);
                debug(err);
                deferred.reject('File saving failed on s3');
            } else {
                debug('File %s saved on s3', path);
                deferred.resolve();
            }
        });

        return deferred.promise;
    }


    function s3GetObject(path) {
        var deferred = Q.defer();

        s3.getObject({
            Bucket: serverSettings.awsHosting.s3.bucket,
            Key: path
        }, function(err, data) {
            if (err) {
                debug('Failed retrieving object %s from s3', path);
                debug(err);
                deferred.reject(err);
            } else {
                debug('Response for %s received from s3...', path);
                deferred.resolve(data.Body);
            }
        });

        return deferred.promise;
    }

}

module.exports = ResultsDatastore;