/**
 * Creation of a queue and it's worker function
 */

var util                = require('util');
var EventEmitter        = require('events').EventEmitter;
var async               = require('async');
var phantomasWrapper    = require('./phantomasWrapper');


var testQueue = function() {
    'use strict';

    var currentTask = null;
    var self = this;

    var queue = async.queue(function(task, callback) {
        currentTask = task;

        console.log('Starting test ' + task.testId);
        
        phantomasWrapper.execute(task, function(err, json, results) {
            console.log('Test ' + task.testId + ' complete');
            currentTask = null;
            callback(err, json, results);
            self.emit('queueMoving');
        });
    });

    
    // Use this method to add a test to the queue
    this.push = queue.push;

    
    // Gives the position of a task in the queue
    // Returns 0 if it is the current running task
    // Returns -1 if not found
    this.indexOf = function(testId) {
        if (currentTask && currentTask.testId === testId) {
            return 0;
        }

        var position = -1;
        if (queue.length() > 0) {
            queue.tasks.forEach(function(task, index) {
                if (task.data.testId === testId) {
                    position = index + 1;
                }
            });
        }
        return position;
    };

    this.testComplete = function(testId) {
        self.emit('testComplete', testId);
    };

    this.testFailed = function(testId) {
        self.emit('testFailed', testId);
    };
};

// extend the EventEmitter class
util.inherits(testQueue, EventEmitter);

module.exports = new testQueue();