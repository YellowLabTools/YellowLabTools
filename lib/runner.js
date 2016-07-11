var Q                       = require('q');
var debug                   = require('debug')('ylt:runner');

var phantomasWrapper        = require('./tools/phantomas/phantomasWrapper');
var jsExecutionTransformer  = require('./tools/jsExecutionTransformer');
var colorDiff               = require('./tools/colorDiff');
var mediaQueriesChecker     = require('./tools/mediaQueriesChecker');
var isHttp2                 = require('./tools/isHttp2');
var redownload              = require('./tools/redownload/redownload');
var rulesChecker            = require('./rulesChecker');
var scoreCalculator         = require('./scoreCalculator');


var Runner = function(params) {
    'use strict';

    var deferred = Q.defer();

    // The pivot format
    var data = {
        params: params,
        toolsResults: {}
    };

    // Execute Phantomas first
    phantomasWrapper.execute(data)

    .then(function(phantomasResults) {
        data.toolsResults.phantomas = phantomasResults;

        // Treat the JS Execution Tree from offenders
        data = jsExecutionTransformer.transform(data);

        // Compare colors
        data = colorDiff.compareAllColors(data);

        // Check media queries
        data = mediaQueriesChecker.analyzeMediaQueries(data);

        // Redownload every file
        return redownload.recheckAllFiles(data);

    })

    .then(function(data) {
        // Check if HTTP2
        return isHttp2.check(data);
    })

    .then(function(data) {

        // Rules checker
        var policies = require('./metadata/policies');
        data.rules = rulesChecker.check(data, policies);


        // Scores calculator
        var scoreProfileGeneric = require('./metadata/scoreProfileGeneric.json');
        data.scoreProfiles = {
            generic : scoreCalculator.calculate(data, scoreProfileGeneric)
        };

        
        delete data.toolsResults.phantomas.metrics.javascriptExecutionTree;
        delete data.toolsResults.phantomas.offenders.javascriptExecutionTree;
        delete data.toolsResults.phantomas.metrics.scrollExecutionTree;
        delete data.toolsResults.phantomas.offenders.scrollExecutionTree;


        if (data.toolsResults.phantomas.offenders.blockedRequests) {
            data.blockedRequests = data.toolsResults.phantomas.offenders.blockedRequests;
        }


        // Finished!
        deferred.resolve(data);
    })

    .fail(function(err) {
        debug('Run failed');
        debug(err);

        deferred.reject(err);
    });


    return deferred.promise;
};

module.exports = Runner;