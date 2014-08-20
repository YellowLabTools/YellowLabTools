/**
 * Meters the number of page errors, and provides traces as offenders for "jsErrors" metric
 */

exports.version = '0.3.a';

exports.module = function(phantomas) {
    'use strict';
    
    phantomas.setMetric('jsErrors'); // @desc number of JavaScript errors
    
    function formatTrace(trace) {
        var ret = [];

        if(Array.isArray(trace)) {
            trace.forEach(function(entry) {
                ret.push((entry.function ? entry.function + ' ' : '') + (entry.sourceURL || entry.file) + ':' + entry.line);
            });
        }

        return ret;
    }

    phantomas.on('jserror', function(msg, trace) {
        trace = formatTrace(trace);

        phantomas.log(msg);
        phantomas.log('Backtrace: ' + trace.join(' / '));

        phantomas.incrMetric('jsErrors');
        phantomas.addOffender('jsErrors', msg + ' - ' + trace.join(' / '));

        // Yeah, this is weird, i'm sending the error back to the browser...
        phantomas.evaluate(function(msg, caller, trace) {
            (function(phantomas) {

                phantomas.pushContext({
                    type: 'error',
                    callDetails: {
                        arguments: [msg]
                    },
                    caller: caller,
                    backtrace: trace
                });

            })(window.__phantomas);
        }, msg, trace[0], trace.join(' / '));
    });
};
