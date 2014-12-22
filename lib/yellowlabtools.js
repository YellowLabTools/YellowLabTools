var Q = require('q');

var Runner = require('./runner');


var YellowLabTools = function(url, options) {
    'use strict';

    var deferred = Q.defer();

    if (!url) {

        deferred.reject('URL missing');

    } else {

        if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
            url = 'http://' + url;
        }

        var params = {
            url: url,
            options: options || {}
        };

        var runner = new Runner(params)
            .then(function(data) {
                deferred.resolve(data);
            })
            .fail(function(err) {
                deferred.reject(err);
            });
    }

    return deferred.promise;
};

module.exports = YellowLabTools;