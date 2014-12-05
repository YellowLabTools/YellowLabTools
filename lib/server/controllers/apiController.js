var debug               = require('debug')('ylt:server');

var YellowLabTools      = require('../../yellowlabtools');
var RunsQueue           = require('../datastores/runsQueue');
var RunsDatastore       = require('../datastores/runsDatastore');
var ResultsDatastore    = require('../datastores/resultsDatastore');


var ApiController = function(app) {
    'use strict';

    var queue = new RunsQueue();
    var runsDatastore = new RunsDatastore();
    var resultsDatastore = new ResultsDatastore();

    // Retrieve the list of all runs
    /*app.get('/api/runs', function(req, res) {
        // NOT YET
    });*/

    // Create a new run
    app.post('/api/runs', function(req, res) {

        // Grab the test parameters and generate a random run ID
        var run = {
            runId: (Date.now()*1000 + Math.round(Math.random()*1000)).toString(36),
            params: {
                url: req.body.url,
                waitForResponse: req.body.waitForResponse !== false
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

            new YellowLabTools(run.params.url)
                .then(function(data) {

                    debug('Success');
                    runsDatastore.markAsComplete(run.runId);

                    // Save result in datastore
                    data.runId = run.runId;
                    resultsDatastore.saveResult(data);

                    // Send result if the user was waiting
                    if (run.params.waitForResponse) {
                        
                        res.redirect(302, '/api/results/' + run.runId);
                    }

                }).fail(function(err) {
                    
                    console.error('Test failed for %s', run.params.url);
                    console.error(err);
                    console.error(err.stack);

                    runsDatastore.markAsFailed(run.runId);
                    
                }).finally(function() {
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
        // Retourne 200 si existe ou 404 si n'existe pas
    });
    */

    // Retrive one result by id
    app.get('/api/results/:id', function(req, res) {
        var runId = req.params.id;

        resultsDatastore.getResult(runId)
            .then(function(data) {
                // This is the pivot format, we might need to clean it first?

                // Hide phantomas results
                data.toolsResults.phantomas = {};
                
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data, null, 2));
            }).fail(function() {
                res.status(404).send('Not found');
            });
    });

};

module.exports = ApiController;