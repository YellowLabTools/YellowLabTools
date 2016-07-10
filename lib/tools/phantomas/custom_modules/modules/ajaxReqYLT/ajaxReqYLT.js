/**
 * Analyzes AJAX requests
 */
/* global window: true */

exports.version = '0.2.a';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('ajaxRequests'); // @desc number of AJAX requests
    phantomas.setMetric('synchronousXHR'); // @desc number of synchronous 

    phantomas.on('init', function() {
        phantomas.evaluate(function() {
            (function(phantomas) {
                phantomas.spy(window.XMLHttpRequest.prototype, 'open', null, function(result, method, url, async) {
                    phantomas.incrMetric('ajaxRequests');
                    phantomas.addOffender('ajaxRequests', '<%s> [%s]', url, method);

                    if (async === false) {
                        phantomas.incrMetric('synchronousXHR');
                        phantomas.addOffender('synchronousXHR', url);
                        phantomas.log('ajaxRequests: synchronous XMLHttpRequest call to <%s>', url);
                    }
                }, true);
            })(window.__phantomas);
        });
    });
};