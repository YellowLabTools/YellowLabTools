var Q                       = require('q');
var debug                   = require('debug')('ylt:runner');

var phantomasWrapper        = require('./tools/phantomas/phantomasWrapper');
var jsExecutionTransformer  = require('./tools/jsExecutionTransformer');
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
    phantomasWrapper.execute(data).then(function(phantomasResults) {
        data.toolsResults.phantomas = phantomasResults;

        // Treat the JS Execution Tree from offenders
        data = jsExecutionTransformer.transform(data);

        // Other tools go here


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

        return data;

    }).then(function(data) {

        // Finished!
        deferred.resolve(data);

    }).fail(function(err) {
        debug('Run failed');
        debug(err);

        deferred.reject(err);
    });


    return deferred.promise;
};

module.exports = Runner;