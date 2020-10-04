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

        var viewportOption = null;
        // Setting screen dimensions for desktop devices only.
        // Phone and tablet dimensions are dealt by Phantomas.
        if (task.options.device === 'desktop') {
            // Similar to an old non-retina Macbook Air 13"
            viewportOption = '1280x800x1';
        } else if (task.options.device === 'desktop-hd') {
            // Similar to a retina Macbook Pro 16"
            viewportOption = '1536x960x2';
        }

        var options = {
            
            // Cusomizable options
            'timeout': task.options.timeout || 60,
            'user-agent': (task.options.device === 'desktop') ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) YLT Chrome/85.0.4183.121 Safari/537.36' : null,
            'tablet': (task.options.device === 'tablet'),
            'phone': (task.options.device === 'phone'),
            'screenshot': task.options.screenshot || false,
            'viewport': viewportOption,
            'wait-for-network-idle': true,
            //'wait-for-selector': task.options.waitForSelector,
            'cookie': task.options.cookie,
            'auth-user': task.options.authUser,
            'auth-pass': task.options.authPass,
            'block-domain': task.options.blockDomain,
            'allow-domain': task.options.allowDomain,
            'no-externals': task.options.noExternals,

            // Mandatory
            'analyze-css': true,
            'ignore-ssl-errors': true
        };


        // Proxy option can't be set to null or undefined...
        // this is why it's set now and not in the object above
        if (task.options.proxy) {
            options.proxy = task.options.proxy;
        }

        // It's time to launch the test!!!
    
        const promise = phantomas(task.url, options);

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