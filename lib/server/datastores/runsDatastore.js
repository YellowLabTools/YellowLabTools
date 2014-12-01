

function RunsDatastore() {
    'use strict';

    // NOT PERSISTING RUNS
    // For the moment, maybe one day
    var runs = {};


    this.add = function(run) {
        runs[run._id] = run;
    };

    this.get = function(runId) {
        return runs[runId];
    };
    
    this.update = function(run) {
        runs[run._id] = run;
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