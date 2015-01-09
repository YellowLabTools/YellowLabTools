var debug               = require('debug')('ylt:server');

var ylt                 = require('../../index');
var RunsQueue           = require('../datastores/runsQueue');
var RunsDatastore       = require('../datastores/runsDatastore');
var ResultsDatastore    = require('../datastores/resultsDatastore');


var ApiController = function(app) {
    'use strict';

    var queue = new RunsQueue();
    var runsDatastore = new RunsDatastore();
    var resultsDatastore = new ResultsDatastore();



    // Create a new run
    app.post('/api/runs', function(req, res) {

        // Grab the test parameters and generate a random run ID
        var run = {
            runId: (Date.now()*1000 + Math.round(Math.random()*1000)).toString(36),
            params: {
                url: req.body.url,
                waitForResponse: req.body.waitForResponse !== false && req.body.waitForResponse !== 'false' && req.body.waitForResponse !== 0,
                partialResult: req.body.partialResult || null
            }
        };

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

            debug('Launching test %s on %s', run.runId, run.params.url);

            ylt(run.params.url)

                .then(function(data) {

                    debug('Success');
                    

                    // Save result in datastore
                    data.runId = run.runId;
                    resultsDatastore.saveResult(data)
                        .then(function() {

                            runsDatastore.markAsComplete(run.runId);
                            
                            // Send result if the user was waiting
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
                            debug('Saving results to resultsDatastore failed:');
                            debug(err);

                            res.status(500).send('Saving results failed');
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

        }).fail(function(err) {
            console.error('Error or YLT\'s core instanciation');
            console.error(err);
            console.error(err.stack);
        });

        // The user doesn't not want to wait for the response, sending the run ID only
        if (!run.params.waitForResponse) {
            console.log('Sending response without waiting.');
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

};

module.exports = ApiController;