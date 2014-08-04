/**
 * Meters the number of page errors, and provides traces as offenders for "jsErrors" metric
 */
'use strict';

exports.version = '0.3.a';

exports.module = function(phantomas) {
    phantomas.setMetric('jsErrors'); // @desc number of JavaScript errors
    
    function formatTrace(trace) {
        var ret = [];

        if(Array.isArray(trace)) {
            trace.forEach(function(entry) {
                ret.push((entry.function ? entry.function + '(): ' : 'unknown fn: ') + (entry.sourceURL || entry.file) + ' @ ' + entry.line);
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

        // TODO : send the error back to the browser ?
        /*phantomas.pushContext({
            type: 'error',
            callDetails: {
                arguments: [msg]
            },
            caller: trace[0],
            backtrace: trace.join(' / ')
        });*/
    });
};
