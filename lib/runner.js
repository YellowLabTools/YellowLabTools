var Q = require('q');
var debug = require('debug')('ylt:yellowlabtools');

var phantomasWrapper = require('./tools/phantomasWrapper');
var rulesChecker = require('./rulesChecker');

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

        // Other tools go there


        // Rules checker
        var policies = require('./metadata/policies.json');
        data.rules = rulesChecker.check(data, policies);


        deferred.resolve(data);

    }).fail(function(err) {
        debug('Run failed');
        debug(err);

        deferred.reject(err);
    });


    return deferred.promise;
};

module.exports = Runner;