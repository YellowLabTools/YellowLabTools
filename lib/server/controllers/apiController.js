var debug               = require('debug')('ylt:server');
var Q                   = require('q');

var ylt                 = require('../../index');
var ScreenshotHandler   = require('../../screenshotHandler');
var RunsQueue           = require('../datastores/runsQueue');
var RunsDatastore       = require('../datastores/runsDatastore');
var ResultsDatastore    = require('../datastores/resultsDatastore');
var serverSettings      = require('../../../server_config/settings.json');

var ApiController = function(app) {
    'use strict';

    var queue = new RunsQueue();
    var runsDatastore = new RunsDatastore();
    var resultsDatastore = new ResultsDatastore();

    // Create a new run
    app.post('/api/runs', function(req, res) {

        // Add http to the test URL
        if (req.body.url && req.body.url.toLowerCase().indexOf('http://') !== 0 && req.body.url.toLowerCase().indexOf('https://') !== 0) {
            req.body.url = 'http://' + req.body.url;
        }

        // Block requests to unwanted websites (=spam)
        if (isBlocked(req.body.url)) {
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

        // Create a temporary folder to save the screenshot
        var screenshot;
        if (run.params.screenshot) {
            screenshot = ScreenshotHandler.getScreenshotTempFile();
        }

        // Add test to the testQueue
        debug('Adding test %s to the queue', run.runId);
        var queuePromise = queue.push(run.runId);

        // Save the run to the datastore
        runsDatastore.add(run, queuePromise.startingPosition);


        // Listening for position updates
        queuePromise.progress(function(position) {
            runsDatastore.updatePosition(run.runId, position);
        });

        // Let's start the run
        queuePromise.then(function() {

            runsDatastore.updatePosition(run.runId, 0);

            console.log('Launching test ' + run.runId + ' on ' + run.params.url);

            var runOptions = {
                screenshot: run.params.screenshot ? screenshot.getTmpFilePath() : false,
                device: run.params.device,
                proxy: run.params.proxy,
                waitForSelector: run.params.waitForSelector,
                cookie: run.params.cookie,
                authUser: run.params.authUser,
                authPass: run.params.authPass,
                blockDomain: run.params.blockDomain,
                allowDomain: run.params.allowDomain,
                noExternals: run.params.noExternals,
                phantomasEngine: serverSettings.phantomasEngine
            };

            return ylt(run.params.url, runOptions);

        })

        // Phantomas completed, let's save the screenshot if any
        .then(function(data) {

            debug('Success');
            data.runId = run.runId;

            
            // Some conditional steps are made if there is a screenshot
            var screenshotPromise = Q.resolve();

            if (run.params.screenshot) {
                
                // Replace the empty promise created earlier with Q.resolve()
                screenshotPromise = screenshot.toThumbnail(serverSettings.screenshotWidth || 400)
                
                    // Read screenshot
                    .then(function(screenshotBuffer) {
                        
                        if (screenshotBuffer) {
                            debug('Image optimized');
                            data.screenshotBuffer = screenshotBuffer;

                            // Official path to get the image
                            data.screenshotUrl = 'api/results/' + data.runId + '/screenshot.jpg';
                        }

                    })
                    
                    // Delete screenshot temporary file
                    .then(screenshot.deleteTmpFile)

                    // Don't worry if there's an error
                    .fail(function(err) {
                        debug('An error occured while creating the screenshot\'s thumbnail. Ignoring and continuing...');
                    });

            }

            // Let's continue
            screenshotPromise

                // Save results
                .then(function() {
                    // Remove uneeded temp screenshot path
                    delete data.params.options.screenshot;

                    // Here we can remove tools results if not needed

                    return resultsDatastore.saveResult(data);
                })

                // Mark as the run as complete and send the response if the request is still waiting
                .then(function() {

                    debug('Result saved in datastore');

                    runsDatastore.markAsComplete(run.runId);

                    if (run.params.waitForResponse) {

                        // If the user only wants a portion of the result (partialResult option)
                        switch(run.params.partialResult) {
                            case 'generalScores': 
                                res.redirect(302, '/api/results/' + run.runId + '/generalScores');
                                break;
                            case 'rules': 
                                res.redirect(302, '/api/results/' + run.runId + '/rules');
                                break;
                            case 'javascriptExecutionTree':
                                res.redirect(302, '/api/results/' + run.runId + '/javascriptExecutionTree');
                                break;
                            case 'phantomas':
                                res.redirect(302, '/api/results/' + run.runId + '/toolsResults/phantomas');
                                break;
                            default:
                                res.redirect(302, '/api/results/' + run.runId);
                        }
                    }
                                    
                })
                .fail(function(err) {
                    console.error('Test failed for URL: %s', run.params.url);
                    console.error(err.toString());

                    runsDatastore.markAsFailed(run.runId, err.toString());

                    res.status(500).send('An error occured');
                });

        })

        .fail(function(err) {
                    
            console.error('Test failed for URL: %s', run.params.url);
            console.error(err.toString());

            runsDatastore.markAsFailed(run.runId, err.toString());

            res.status(400).send('Bad request');
            
        })

        .finally(function() {
            queue.remove(run.runId);
        });


        // The user doesn't want to wait for the response, sending the run ID only
        if (!run.params.waitForResponse) {
            debug('Sending response without waiting.');
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({runId: run.runId}));
        }

    });


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

    // Retrieve the list of all runs
    /*app.get('/api/runs', function(req, res) {
        // NOT YET
    });*/

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
