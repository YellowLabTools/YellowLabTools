/**
 * Analyzes if HTTP responses keep the connections alive.
 */

exports.version = '0.1';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('closedConnections'); // @desc requests not keeping the connection alive and slowing down the next request @offenders

    var closedConnectionHosts = {};

    phantomas.on('recv', function(entry, res) {
        var connectionHeader = (entry.headers.Connection || '').toLowerCase();
        // Taking the protocol in account, in case the same domain is called with two different protocols.
        var host = entry.protocol + '://' + entry.domain;

        if (connectionHeader.indexOf('close') >= 0) {
            // Don't blame it immediatly, wait to see if the connection is needed a second time.
            closedConnectionHosts[host] = entry.url;
        }
    });

    phantomas.on('send', function(entry, res) {
        var host = entry.protocol + '://' + entry.domain;
        var previousClosedConnection = closedConnectionHosts[host];
        
        if (previousClosedConnection) {
            // There was a closed connection. We can blame it safely now!
            phantomas.incrMetric('closedConnections');
            phantomas.addOffender('closedConnections', previousClosedConnection);

            closedConnectionHosts[host] = null;
        }
    });
};
