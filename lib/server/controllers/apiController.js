var debug           = require('debug')('ylt:server');

var runsQueue       = require('../datastores/runsQueue');
var runsDatastore   = require('../datastores/runsDatastore');


function ApiController(app) {
    'use strict';

    // Retrieve the list of all runs
    /*app.get('/runs', function(req, res) {
        // NOT YET
    });*/

    // Create a new run
    app.post('/runs', function(req, res) {

        // Grab the test parameters
        var run = {
            // Generate a random run ID
            _id: (Date.now()*1000 + Math.round(Math.random()*1000)).toString(36),
            params: {
                url: req.body.url,
                waitForResponse: req.body.waitForResponse || true
            }
        };

        // Add test to the testQueue
        debug('Adding test %s to the queue', run._id);
        var queuing = runsQueue.push(run._id);

        
        // Save the run to the datastore
        var position = runsQueue.getPosition(run._id);
        run.status = {
            statusCode: (position === 0) ? STATUS_RUNNING : STATUS_AWAITING,
            position: position
        };
        runsDatastore.add(run);


        // Listening for position updates
        queuing.progress(function(position) {
            var savedRun = runsDatastore.get(run._id);
            savedRun.status = {
                statusCode: STATUS_AWAITING,
                position: position
            };
            runsDatastore.update(savedRun);
        });


        queuing.then(function() {
            
        });

        // The user doesn't not want to wait for the response
        if (!params.waitForResponse) {

            // Sending just the test id
            res.setHeader('Content-Type', 'application/javascript');
            res.send(JSON.stringify({
                testId: testId
            }));
        }
    });

    // Retrive one run by id
    app.get('/run/:id', function(req, res) {

    });

    // Delete one run by id
    /*app.delete('/run/:id', function(req, res) {
        // NOT YET
    });*/


    var STATUS_AWAITING     = 'awaiting';
    var STATUS_RUNNING      = 'running';
    var STATUS_DONE         = 'done';
    var STATUS_FAILED       = 'failed';

}

module.exports = ApiController;