var Q = require('q');
var debug = require('debug')('ylt:runsQueue');


function RunsQueue() {
    'use strict';

    var queue = [];


    this.push = function(runId) {
        var deferred = Q.defer();
        var startingPosition = queue.length;

        debug('Adding run %s to the queue, position is %d', runId, startingPosition);

        if (startingPosition === 0) {
            
            // The queue is empty, let's run immediatly
            queue.push({
                runId: runId
            });
            
            deferred.resolve();

        } else {
            
            queue.push({
                runId: runId,
                positionChangedCallback: function(position) {
                    deferred.notify(position);
                },
                itIsTimeCallback: function() {
                    deferred.resolve();
                }
            });
        }

        var promise = deferred.promise;
        promise.startingPosition = startingPosition;
        return promise;
    };


    this.getPosition = function(runId) {
        // Position 0 means it's a work in progress (a run is removed AFTER it is finished, not before)
        var position = -1;

        queue.some(function(run, index) {
            if (run.runId === runId) {
                position = index;
                return true;
            }
            return false;
        });

        return position;
    };


    this.remove = function(runId) {
        var position = this.getPosition(runId);
        if (position >= 0) {
            queue.splice(position, 1);
        }

        // Update other runs' positions
        queue.forEach(function(run, index) {
            if (index === 0 && run.itIsTimeCallback) {
                run.itIsTimeCallback();
            } else if (index > 0 && run.positionChangedCallback) {
                run.positionChangedCallback(index);
            }
        });

    };

    this.length = function() {
        return queue.length;
    };
}

module.exports = RunsQueue;