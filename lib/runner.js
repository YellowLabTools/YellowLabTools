var Q = require('q');

var phantomasWrapper = require('./tools/phantomasWrapper');
var rulesChecker = require('./rulesChecker');

var Runner = function(params) {
    'use strict';

    // The pivot format
    var data = {
        params: params,
        toolsResults: {}
    };

    // Execute Phantomas first
    var run = phantomasWrapper.execute(data);

    // Other tools go here


    // Read each policy and save the results
    run.then(function() {
        var policies = require('./metadata/policies.json');
        return rulesChecker.check(data, policies);
    });

    // TODO : error handler
    /*run.catch(function(err) {
        console.log('The run failed');
        console.log(err);
    });*/

    run.done(data);

    return run;
};

module.exports = Runner;