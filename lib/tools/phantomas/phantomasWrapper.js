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
     */
    this.execute = function(data) {

        var deferred = Q.defer();
        var task = data.params;

        var options = {
            
            // Cusomizable options
            'engine': task.options.phantomasEngine || 'webkit',
            'timeout': task.options.timeout || 30,
            'user-agent': (task.options.device === 'desktop') ? 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) YLT Chrome/27.0.1453.110 Safari/537.36' : null,
            'tablet': (task.options.device === 'tablet'),
            'phone': (task.options.device === 'phone'),
            'screenshot': task.options.screenshot || false,
            'wait-for-selector': task.options.waitForSelector,
            'cookie': task.options.cookie,
            'auth-user': task.options.authUser,
            'auth-pass': task.options.authPass,
            'block-domain': task.options.blockDomain,
            'allow-domain': task.options.allowDomain,
            'no-externals': task.options.noExternals,

            // Mandatory
            'reporter': 'json:pretty',
            'analyze-css': true,
            'ignore-ssl-errors': true,
            'skip-modules': [
                'ajaxRequests', // overridden
                'domHiddenContent', // overridden
                'domMutations', // not compatible with webkit
                'domQueries', // overridden
                'events', // overridden
                'filmStrip', // not needed
                'har', // not needed for the moment
                'javaScriptBottlenecks', // needs to be launched after custom module scopeYLT
                'jQuery', // overridden
                'jserrors', // overridden
                'lazyLoadableImages', //overridden
                'pageSource', // not needed
                'windowPerformance' // overridden
            ].join(','),
            'include-dirs': [
                path.join(__dirname, 'custom_modules/core'),
                path.join(__dirname, 'custom_modules/modules')
            ].join(',')
        };

        // Proxy option can't be set to null or undefined...
        // this is why it's set now and not in the object above
        if (task.options.proxy) {
            options.proxy = task.options.proxy;
        }

        // Output the command line for debugging purpose
        debug('If you want to reproduce the phantomas task only, copy the following command line:');
        var optionsString = '';
        for (var opt in options) {
            var value = options[opt];
            
            if ((typeof value === 'string' || value instanceof String) && value.indexOf(' ') >= 0) {
                value = '"' + value + '"';
            }

            if (value === true) {
                optionsString += ' ' + '--' + opt;
            } else if (value === false || value === null || value === undefined) {
                // Nothing
            } else {
                optionsString += ' ' + '--' + opt + '=' + value;
            }

        }
        debug('node node_modules/phantomas/bin/phantomas.js --url=' + task.url + optionsString + ' --verbose');


        // It's time to launch the test!!!
    
        const promise = phantomas(task.url, {
            'analyze-css': true
        });

        // handle the promise
        promise.
            then(results => {
                var json = {
                    generator: results.getGenerator(),
                    url: results.getUrl(),
                    metrics: results.getMetrics(),
                    offenders: results.getAllOffenders()
                };

                deferred.resolve(json);
            }).
            catch(res => {
                console.error(res);
                deferred.reject('Phantomas failed: ' + res.message);
            });

        /*var process = phantomas(task.url, options, function(err, json, results) {
        var errorCode = err ? parseInt(err.message, 10) : null;

        debug('Returning from Phantomas with error %s', errorCode);

        // Adding some YellowLabTools errors here
        if (json && json.metrics && (!json.metrics.javascriptExecutionTree || !json.offenders.javascriptExecutionTree)) {
            errorCode = 1001;
        }

        if (!errorCode && (!json || !json.metrics)) {
            errorCode = 1002;
        }

        // Don't cancel test if it is a timeout and we've got some results
        if (errorCode === 252 && json) {
            debug('Timeout after ' + options.timeout + ' seconds. But it\'s not a problem, the test is valid.');
            errorCode = null;
        }

        if (errorCode) {
            debug('Attempt failed. Error code ' + errorCode);
        }

        }, function(err, json) {

            if (err) {
                debug('All ' + triesNumber + ' attemps failed for the test');
                deferred.reject(err);

            } else {

                deferred.resolve(json);

            }
        });
        */

        return deferred.promise;
    };
};

module.exports = new PhantomasWrapper();