

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


    this.markAsFailed = function(runId, err) {
        var run = runs[runId];

        var errorMessage;
        switch(err) {
            case '1':
                errorMessage = "Error 1: unknown error";
                break;
            case '252':
                errorMessage = "Error 252: page timeout in Phantomas";
                break;
            case '253':
                errorMessage = "Error 253: Phantomas config error";
                break;
            case '254':
                errorMessage = "Error 254: page loading failed in PhantomJS";
                break;
            case '255':
                errorMessage = "Error 255: Phantomas error";
                break;
            case '1001':
                errorMessage = "Error 1001: JavaScript profiling failed";
                break;
            case '1002':
                errorMessage = "Error 1002: missing Phantomas metrics";
                break;
            case '1003':
                errorMessage = "Error 1003: Phantomas not returning";
                break;
            default:
                errorMessage = err;
        }

        run.status = {
            statusCode: STATUS_FAILED,
            error: errorMessage
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