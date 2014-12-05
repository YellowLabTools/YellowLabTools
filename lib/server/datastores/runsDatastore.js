

function RunsDatastore() {
    'use strict';

    // NOT PERSISTING RUNS
    // For the moment, maybe one day
    var runs = {};

    var STATUS_AWAITING     = 'awaiting';
    var STATUS_RUNNING      = 'running';
    var STATUS_COMPLETE     = 'complete';
    var STATUS_FAILED       = 'failed';


    this.add = function(run, position) {
        runs[run.runId] = run;
        this.updatePosition(run.runId, position);
    };


    this.get = function(runId) {
        return runs[runId];
    };

    
    this.updatePosition = function(runId, position) {
        var run = runs[runId];
        
        if (position > 0) {
            run.status = {
                statusCode: STATUS_AWAITING,
                position: position
            };
        } else {
            run.status = {
                statusCode: STATUS_RUNNING
            };
        }

        runs[runId] = run;
    };


    this.markAsComplete = function(runId) {
        var run = runs[runId];

        run.status = {
            statusCode: STATUS_COMPLETE
        };

        runs[runId] = run;
    };


    this.markAsFailed = function(runId) {
        var run = runs[runId];

        run.status = {
            statusCode: STATUS_FAILED
        };

        runs[runId] = run;
    };


    this.delete = function(runId) {
        delete runs[runId];
    };


    this.list = function() {
        var runsArray = [];
        Object.keys(runs).forEach(function(key) {
            runsArray.push(runs[key]);
        });
        return runsArray;
    };
}

module.exports = RunsDatastore;