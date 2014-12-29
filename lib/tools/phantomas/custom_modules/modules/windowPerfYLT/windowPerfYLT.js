/**
 * Measure when the page reaches certain states
 *
 * @see http://w3c-test.org/webperf/specs/NavigationTiming/#dom-performancetiming-domloading
 * @see https://developers.google.com/web/fundamentals/performance/critical-rendering-path/measure-crp
 */
/* global document: true, window: true */

exports.version = '1.0.a';

exports.module = function(phantomas) {
    'use strict';
    
    // times below are calculated relative to performance.timing.responseEnd (#117)
    phantomas.setMetric('domInteractive');      // @desc time it took to parse the HTML and construct the DOM
    phantomas.setMetric('domContentLoaded');    // @desc time it took to construct both DOM and CSSOM, no stylesheets that are blocking JavaScript execution (i.e. onDOMReady)
    phantomas.setMetric('domContentLoadedEnd'); // @desc time it took to finish handling of onDOMReady event @unreliable
    phantomas.setMetric('domComplete');         // @desc time it took to load all page resources, the loading spinner has stopped spinning

    // backend vs frontend time
    phantomas.setMetric('timeBackend');  // @desc time to the first byte compared to the total loading time [%]
    phantomas.setMetric('timeFrontend'); // @desc time to window.load compared to the total loading time [%]

    // measure dom... metrics from the moment HTML response was fully received
    var responseEndTime = Date.now();

    phantomas.on('responseEnd', function() {
        responseEndTime = Date.now();
        phantomas.log('Performance timing: responseEnd = %d', responseEndTime);
    });

    phantomas.on('init', function() {
        phantomas.evaluate(function(responseEndTime) {
            (function(phantomas) {
                phantomas.spyEnabled(false, 'installing window.performance metrics');

                phantomas.currentStep = 'domCreation';

                // extend window.performance
                // "init" event is sometimes fired twice, pass a value set by "responseEnd" event handler (fixes #192)
                if (typeof window.performance === 'undefined') {
                    window.performance = {
                        timing: {
                            responseEnd: responseEndTime
                        }
                    };

                    phantomas.log('Performance timing: emulating window.performance');
                }
                else {
                    phantomas.log('Performance timing: using native window.performance');
                }

                // onDOMReady
                document.addEventListener("DOMContentLoaded", function() {
                    
                    setTimeout(function() {
                        // use NavigationTiming if possible
                        var time = window.performance.timing.domContentLoadedEventEnd ?
                            (window.performance.timing.domContentLoadedEventEnd - window.performance.timing.responseEnd)
                            :
                            (Date.now() - responseEndTime);

                        phantomas.currentStep = 'domContentLoadedEnd';
                        phantomas.setMetric('domContentLoadedEnd', time, true);
                        phantomas.log('Performance timing: document reached "DOMContentLoadedEnd" state after %d ms', time);

                        phantomas.pushContext({
                            type: 'domContentLoadedEnd'
                        });
                    }, 0);

                    var time = Date.now() - responseEndTime;

                    phantomas.currentStep = 'domContentLoaded';
                    phantomas.setMetric('domContentLoaded', time, true);
                    phantomas.log('Performance timing: document reached "DOMContentLoaded" state after %d ms', time);

                    phantomas.pushContext({
                        type: 'domContentLoaded'
                    });
                });

                // emulate Navigation Timing
                document.addEventListener('readystatechange', function() {
                    var readyState = document.readyState,
                        responseEndTime = window.performance.timing.responseEnd,
                        time = Date.now() - responseEndTime,
                        metricName;

                    // @see http://www.w3.org/TR/html5/dom.html#documentreadystate
                    switch(readyState) {
                        // the browser has finished parsing all of the HTML and DOM construction is complete
                        case 'interactive':
                            metricName = 'domInteractive';
                            break;

                        // the processing is complete and all of the resources on the page have finished downloading
                        case 'complete':
                            metricName = 'domComplete';
                            phantomas.log('Performance timing: %j', window.performance.timing);
                            break;

                        default:
                            phantomas.log('Performance timing: unhandled "%s" state!', readyState);
                            return;
                    }

                    phantomas.currentStep = metricName;
                    phantomas.setMetric(metricName, time, true);
                    phantomas.log('Performance timing: document reached "%s" state after %d ms', readyState, time);

                    phantomas.pushContext({
                        type: metricName
                    });
                });

                phantomas.spyEnabled(true);
            })(window.__phantomas);
        }, responseEndTime);
    });

    /**
     * Emit metrics with backend vs frontend time
     *
     * Performance Golden Rule:
     * "80-90% of the end-user response time is spent on the frontend. Start there."
     *
     * @see http://www.stevesouders.com/blog/2012/02/10/the-performance-golden-rule/
     */
    phantomas.on('report', function() {
        //  The “backend” time is the time it takes the server to get the first byte back to the client.
        //  The “frontend” time is measured from the last byte of the response (responseEnd) until all resources are fetched (domComplete)
        var backendTime = parseInt(phantomas.getMetric('timeToFirstByte'), 10),
            frontendTime = parseInt(phantomas.getMetric('domComplete'), 10),
            totalTime = backendTime + frontendTime,
            backendTimePercentage;

        if (totalTime === 0) {
            return;
        }

        backendTimePercentage = Math.round(backendTime / totalTime * 100);

        phantomas.setMetric('timeBackend', backendTimePercentage);
        phantomas.setMetric('timeFrontend', 100 - backendTimePercentage);

        phantomas.log('Performance timing: backend vs frontend time - %d% / %d%', backendTimePercentage, 100 - backendTimePercentage);
    });
};
