var Q = require('q');

var Runner = require('./runner');


var YellowLabTools = function(url, options) {
    'use strict';

    var deferred = Q.defer();

    if (!url) {

        deferred.reject('URL missing');

    } else {

        // Generate a test id
        var testId = (Date.now()*1000 + Math.round(Math.random()*1000)).toString(36);

        if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
            url = 'http://' + url;
        }

        var params = {
            testId: testId,
            url: url,
            options: options || {}
        };

        var runner = new Runner(params);

        runner.then(function(data) {
            console.log(data);
            deferred.resolve(data);
        });
    }

    return deferred.promise;
};

module.exports = YellowLabTools;