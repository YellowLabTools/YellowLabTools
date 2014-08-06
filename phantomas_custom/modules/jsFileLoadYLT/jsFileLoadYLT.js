/**
 * Meters the number of page errors, and provides traces as offenders for "jsErrors" metric
 */
'use strict';

exports.version = '0.0';

exports.module = function(phantomas) {
    
    phantomas.on('recv', function(entry, res) {
        if (!entry.isJS) {
            return;
        }

        // Yeah, this is weird, i'm sending the information back to the browser...
        phantomas.evaluate(function(url) {
            (function(phantomas) {

                phantomas.pushContext({
                    type: 'script loaded',
                    callDetails: {
                        arguments: [url]
                    }
                });

            })(window.__phantomas);
        }, entry.url);
    });
};
