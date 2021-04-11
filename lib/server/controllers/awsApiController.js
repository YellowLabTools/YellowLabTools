var debug               = require('debug')('ylt:server');
var Q                   = require('q');
var AWS                 = require('aws-sdk');

var ylt                 = require('../../index');
var ScreenshotHandler   = require('../../screenshotHandler');
var RunsQueue           = require('../datastores/runsQueue');
var RunsDatastore       = require('../datastores/runsDatastore');

var serverSettings      = (process.env.IS_TEST) ? require('../../../test/fixtures/settings.json') : require('../../../server_config/settings.json');

var ResultsDatastore = (serverSettings.awsHosting) ? require('../datastores/awsResultsDatastore') : require('../datastores/resultsDatastore');

var ApiController = function(app) {
    'use strict';

    var queue = new RunsQueue();
    var runsDatastore = new RunsDatastore();
    var resultsDatastore = new ResultsDatastore();

    // Increase AWS Lambda timeout
    AWS.config.update({httpOptions: {timeout: 300000}});

    // Create a new run
    app.post('/api/runs', function(req, res) {

        // Add http to the test URL
        if (req.body.url && req.body.url.toLowerCase().indexOf('http://') !== 0 && req.body.url.toLowerCase().indexOf('https://') !== 0) {
            req.body.url = 'https://' + req.body.url;
        }

        // Block requests to unwanted websites (=spam)
        if (req.body.url && isBlocked(req.body.url)) {
            console.error('Test blocked for URL: %s', req.body.url);
            res.status(403).send('Forbidden');
            return;
        }

        // Grab the test parameters and generate a random run ID
        var run = {
            runId: (Date.now()*1000 + Math.round(Math.random()*1000)).toString(36),
            params: {
                url: req.body.url,
                waitForResponse: req.body.waitForResponse === true || req.body.waitForResponse === 'true' || req.body.waitForResponse === 1,
                partialResult: req.body.partialResult || null,
                screenshot: req.body.screenshot || false,
                device: req.body.device || 'desktop',
                proxy: req.body.proxy || null,
                waitForSelector: req.body.waitForSelector || null,
                cookie: req.body.cookie || null,
                authUser: req.body.authUser || null,
                authPass: req.body.authPass || null,
                blockDomain: req.body.blockDomain || null,
                allowDomain: req.body.allowDomain || null,
                noExternals: req.body.noExternals || false
            }
        };

        // Add test to the testQueue
        debug('Adding test %s to the queue', run.runId);
        var queuePromise = queue.push(run.runId);

        // Save the run to the datastore
        //runsDatastore.add(run, queuePromise.startingPosition);
        runsDatastore.add(run, 0);

        // Let's start the run
        queuePromise.then(function() {

            runsDatastore.updatePosition(run.runId, 0);

            console.log('Launching test ' + run.runId + ' on ' + run.params.url);

            var runOptions = {
                screenshot: run.params.screenshot ? ScreenshotHandler.getTmpFileRelativePath() : false,
                device: run.params.device,
                proxy: run.params.proxy,
                waitForSelector: run.params.waitForSelector,
                cookie: run.params.cookie,
                authUser: run.params.authUser,
                authPass: run.params.authPass,
                blockDomain: run.params.blockDomain,
                allowDomain: run.params.allowDomain,
                noExternals: run.params.noExternals
            };

            const {region, arn} = chooseLambdaRegionByGeoIP(req.headers);
            const lambda = new AWS.Lambda({region: region});
            
            return lambda.invoke({
                FunctionName: arn,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({url: run.params.url, id: run.runId, options: runOptions})
            }).promise();

        })

        .then(function(response) {
            debug('We\'ve got a response from AWS Lambda');
            debug('StatusCode = %d', response.StatusCode);
            debug('Payload = %s', response.Payload);

            if (response.StatusCode === 200 && response.Payload && response.Payload !== 'null') {
                const payload = JSON.parse(response.Payload);
                if (payload.status === 'failed') {
                    debug('Failed with error %s', payload.errorMessage);
                    runsDatastore.markAsFailed(run.runId, payload.errorMessage);
                } else {
                    debug('Success!');
                    runsDatastore.markAsComplete(run.runId);
                }
            } else {
                debug('Empty response from the lambda agent');
                runsDatastore.markAsFailed(run.runId, "Empty response from the agent");
            }
        })

        .catch(function(err) {
            debug('Error from AWS Lambda:');
            debug(err);

            runsDatastore.markAsFailed(run.runId, err.toString());
        });

        // The user doesn't want to wait for the response, sending the run ID only
        debug('Sending response without waiting.');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({runId: run.runId}));

    });


    // Reads the Geoip_Continent_Code header and chooses the right region from the settings
    function chooseLambdaRegionByGeoIP(headers) {

        // The settings can be configured like this in server_config/settings.json:
        //
        // "awsHosting": {
        //     "lambda": {
        //         "regionByContinent": {
        //             "AF": "eu-west-3",
        //             "AS": "ap-southeast-1",
        //             "EU": "eu-west-3",
        //             "NA": "us-east-1",
        //             "OC": "ap-southeast-1",
        //             "SA": "us-east-1",
        //             "default": "eu-west-3"
        //         },
        //         "arnByRegion": {
        //             "us-east-1": "arn:aws:lambda:us-east-1:xxx:function:xxx",
        //             "eu-west-3": "arn:aws:lambda:eu-west-3:xxx:function:xxx",
        //             "ap-southeast-1": "arn:aws:lambda:ap-southeast-1:xxx:function:xxx"
        //         }
        //     }
        // },

        const header = headers.geoip_continent_code;
        debug('Value of the Geoip_Continent_Code header: %s', header);

        const continent = header || 'default';
        const region = serverSettings.awsHosting.lambda.regionByContinent[continent];
        const arn = serverSettings.awsHosting.lambda.arnByRegion[region];
        debug('The chosen AWS Lambda is: %s', arn);

        return {region, arn};
    }


    // Retrive one run by id
    app.get('/api/runs/:id', function(req, res) {
        var runId = req.params.id;

        var run = runsDatastore.get(runId);

        if (run) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(run, null, 2));
        } else {
            res.status(404).send('Not found');
        }
    });

    // Counts all pending runs
    app.get('/api/runs', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            pendingRuns: queue.length(),
            timeSinceLastTestStarted: queue.timeSinceLastTestStarted()
        }, null, 2));
    });

    // Delete one run by id
    /*app.delete('/api/runs/:id', function(req, res) {
        deleteRun()
    });*/

    // Delete all
    /*app.delete('/api/runs', function(req, res) {
        purgeRuns()
    });

    // List all
    app.get('/api/runs', function(req, res) {
        listRuns()
    });

    // Exists
    app.head('/api/runs/:id', function(req, res) {
        existsX();
        // Returns 200 if the result exists or 404 if not
    });
    */

    // Retrive one result by id
    app.get('/api/results/:id', function(req, res) {
        getPartialResults(req.params.id, res, function(data) {
            
            // Some fields can be excluded from the response, this way:
            // /api/results/:id?exclude=field1,field2
            if (req.query.exclude && typeof req.query.exclude === 'string') {
                var excludedFields = req.query.exclude.split(',');
                excludedFields.forEach(function(fieldName) {
                    if (data[fieldName]) {
                        delete data[fieldName];
                    }
                });
            }

            return data;
        });
    });

    // Retrieve one result and return only the generalScores part of the response
    app.get('/api/results/:id/generalScores', function(req, res) {
        getPartialResults(req.params.id, res, function(data) {
            return data.scoreProfiles.generic;
        });
    });

    app.get('/api/results/:id/generalScores/:scoreProfile', function(req, res) {
        getPartialResults(req.params.id, res, function(data) {
            return data.scoreProfiles[req.params.scoreProfile];
        });
    });

    app.get('/api/results/:id/rules', function(req, res) {
        getPartialResults(req.params.id, res, function(data) {
            return data.rules;
        });
    });

    app.get('/api/results/:id/javascriptExecutionTree', function(req, res) {
        getPartialResults(req.params.id, res, function(data) {
            return data.javascriptExecutionTree;
        });
    });

    app.get('/api/results/:id/toolsResults/phantomas', function(req, res) {
        getPartialResults(req.params.id, res, function(data) {
            return data.toolsResults.phantomas;
        });
    });

    function getPartialResults(runId, res, partialGetterFn) {
        resultsDatastore.getResult(runId)
            .then(function(data) {
                var results = partialGetterFn(data);
                
                if (typeof results === 'undefined') {
                    res.status(404).send('Not found');
                    return;
                }

                // Quickfix (TODO remove)
                results.runId = runId;
                results.screenshotUrl = '/api/results/' + runId + '/screenshot.jpg';

                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(results, null, 2));

            }).fail(function() {
                res.status(404).send('Not found');
            });
    }

    // Retrive one result by id
    app.get('/api/results/:id/screenshot.jpg', function(req, res) {
        var runId = req.params.id;

        resultsDatastore.getScreenshot(runId)
            .then(function(screenshotBuffer) {
                
                res.setHeader('Content-Type', 'image/jpeg');
                res.send(screenshotBuffer);

            }).fail(function() {
                res.status(404).send('Not found');
            });
    });

    function isBlocked(url) {
        if (!serverSettings.blockedUrls) {
            return false;
        }

        return serverSettings.blockedUrls.some(function(blockedUrl) {
            return (url.indexOf(blockedUrl) === 0);
        });
    }
};

module.exports = ApiController;
