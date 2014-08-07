/**
 * Yellow Lab Tools main file
 */

var q               = require ('q');
var phantomas       = require('phantomas');

var PhantomasWrapper = function() {
    'use strict';

    /**
     * This is the phantomas launcher. It merges user chosen options into the default options
     * Available options :
     *
     * - timeout : in seconds (default 60)
     * - jsDeepAnalysis : should we inspect subrequests in the javascript execution tree (reported durations of main tasks will be slower than usual)
     *
     */
     this.execute = function(task, callback) {

        var options = {
            // Cusomizable options
            timeout: task.options.timeout || 60,
            'js-deep-analysis': task.options.jsDeepAnalysis || false,

            // Mandatory
            reporter: 'json:pretty',
            'skip-modules': [
                'ajaxRequests',
                'alerts',
                'cacheHits',
                'caching',
                'console',
                'cookies',
                'documentHeight',
                'domains',
                'domComplexity',
                'domMutations',
                'domQueries',
                'filmStrip',
                'jQuery',
                'jserrors',
                'har',
                'headers',
                'localStorage',
                'mainRequest',
                'pageSource',
                'redirects',
                'requestsStats',
                'screenshot',
                'staticAssets',
                'timeToFirst',
                'waitForSelector'
            ].join(','),
            'include-dirs': [
                'phantomas_custom/core',
                'phantomas_custom/modules'
            ].join(',')
        };

        // It's time to launch the test!!!
        phantomas(task.url, options, callback);

    };
};

module.exports = new PhantomasWrapper();