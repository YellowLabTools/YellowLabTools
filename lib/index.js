var debug               = require('debug')('ylt:index');
var Q                   = require('q');

var Runner              = require('./runner');
var ScreenshotHandler   = require('./screenshotHandler');


var yellowLabTools = function(url, options) {
    var deferred = Q.defer();

    if (!url) {

        deferred.reject('URL missing');

    } else {

        if (url.toLowerCase().indexOf('http://') !== 0 && url.toLowerCase().indexOf('https://') !== 0) {
            url = 'http://' + url;
        }

        var params = {
            url: url,
            options: options || {}
        };

        var runner = new Runner(params)
        
        .progress(deferred.notify)

        .then(function(data) {

            // If a screenshot save function was provided in the options
            if (typeof options.saveFile === 'function') {
                debug('Now optimizing screenshot...');

                // Remove uneeded temp screenshot path
                delete data.params.options.screenshot;

                // Add the screenshot url instead
                data.screenshotUrl = '/api/results/' + data.runId + '/screenshot.jpg';

                // TODO: temporarily set all screenshot sizes to 600px, until we find a solution
                ScreenshotHandler.findAndOptimizeScreenshot(600)

                .then(function(screenshotBuffer) {
                    debug('Screenshot optimized, now saving...');
                    
                    return options.saveFile('screenshot.jpg', screenshotBuffer);
                })

                .then(function(response) {
                    debug('Screenshot saved');
                    debug(response);
                })

                .catch(function(err) {
                    // It's ok if we can't save the screenshot
                    debug('Screenshot could not be saved');
                    debug(err);
                })

                .finally(function() {
                    deferred.resolve(data);
                });

            } else {
                deferred.resolve(data);
            }
        })

        .catch(function(err) {
            deferred.reject(err);
        });
    }

    return deferred.promise;
};

module.exports = yellowLabTools;