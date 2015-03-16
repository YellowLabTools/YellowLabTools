var async                   = require('async');
var Q                       = require('q');
var ps                      = require('ps-node');
var path                    = require('path');
var debug                   = require('debug')('ylt:phantomaswrapper');
var phantomas               = require('phantomas');


var PhantomasWrapper = function() {
    'use strict';

    /**
     * This is the phantomas launcher. It merges user chosen options into the default options
     * Available options :
     *
     * - timeout : in seconds (default 60)
     * - jsDeepAnalysis : should we inspect subrequests in the javascript execution tree?
     *
     */
    this.execute = function(data) {

        var deferred = Q.defer();
        var task = data.params;


        var options = {
            // Cusomizable options
            'timeout': task.options.timeout || 60,
            'js-deep-analysis': task.options.jsDeepAnalysis || false,
            'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
            'screenshot': task.options.screenshot || false,

            // Mandatory
            'reporter': 'json:pretty',
            'analyze-css': true,
            'skip-modules': [
                'blockDomains', // not needed
                'domMutations', // not compatible with webkit
                'domQueries', // overriden
                'eventListeners', // overridden
                'filmStrip', // not needed
                'har', // not needed for the moment
                'javaScriptBottlenecks', // needs to be launched after custom module scopeYLT
                'jQuery', // overridden
                'jserrors', // overridden
                'pageSource', // not needed
                'waitForSelector', // not needed
                'windowPerformance' // overriden
            ].join(','),
            'include-dirs': [
                path.join(__dirname, 'custom_modules/core'),
                path.join(__dirname, 'custom_modules/modules')
            ].join(',')
        };

        // Output the command line for debugging purpose
        debug('If you want to reproduce the phantomas task only, copy the following command line:');
        var optionsString = '';
        for (var opt in options) {
            var value = options[opt];
            
            if ((typeof value === 'string' || value instanceof String) && value.indexOf(' ') >= 0) {
                value = '"' + value + '"';
            }

            optionsString += ' ' + '--' + opt + '=' + value;

        }
        debug('node node_modules/phantomas/bin/phantomas.js --url=' + task.url + optionsString + ' --verbose');

        // Kill the application if nothing happens
        var phantomasPid;
        var killer = setTimeout(function() {
            debug('Killing the app because the test on %s was launched %d seconds ago', task.url, 5*options.timeout);
            // If in server mode, forever will restart the server
            
            // Kill the Phantomas process first
            if (phantomasPid) {
                ps.kill(phantomasPid, function(err) {
                    if (err) {
                        debug('Could not kill Phantomas process %s', phantomasPid);
                    }
                    else {
                        debug('Phantomas process %s was correctly killed', phantomasPid);
                    }

                    // Then suicide.
                    process.exit(1);
                });
            }

        }, 5*options.timeout*1000);

        // It's time to launch the test!!!
        var triesNumber = 2;

        async.retry(triesNumber, function(cb) {
            var process = phantomas(task.url, options, function(err, json, results) {
                debug('Returning from Phantomas');

                // Adding some YellowLabTools errors here
                if (json && json.metrics && (!json.metrics.javascriptExecutionTree || !json.offenders.javascriptExecutionTree)) {
                    err = 1001;
                }

                if (!err && (!json || !json.metrics)) {
                    err = 1002;
                }

                // Don't cancel test if it is a timeout and we've got some results
                if (err === 252 && json) {
                    debug('Timeout after ' + options.timeout + ' seconds. But it\'s not a problem, the test is valid.');
                    err = null;
                }

                if (err) {
                    debug('Attempt failed. Error code ' + err);
                }

                cb(err, json);
            });
            
            phantomasPid = process.pid;

        }, function(err, json) {

            clearTimeout(killer);

            if (err) {
                debug('All ' + triesNumber + ' attemps failed for the test');
                deferred.reject(err);

            } else {

                deferred.resolve(json);

            }
        });

        return deferred.promise;
    };
};

module.exports = new PhantomasWrapper();