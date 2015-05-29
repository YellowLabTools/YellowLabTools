/**
 * Retries download on every request to get the real file size
 *
 */

exports.version = '0.1';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('requestsList');

    var requests = [];

    phantomas.on('recv', function(entry, res) {
        requests.push(entry);
    });

    phantomas.on('report', function() {
        phantomas.setMetric('requestsList', true, true);
        phantomas.addOffender('requestsList', JSON.stringify(requests));
    });
};
