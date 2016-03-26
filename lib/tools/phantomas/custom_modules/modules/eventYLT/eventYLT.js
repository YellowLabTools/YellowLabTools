/**
 * Analyzes events bound to DOM elements
 */
/* global Document: true, Element: true, window: true */

exports.version = '0.4.a';

exports.module = function(phantomas) {
    'use strict';
    
    phantomas.setMetric('eventsBound'); // @desc number of EventTarget.addEventListener calls
    phantomas.setMetric('eventsDispatched'); // @desc number of EventTarget.dispatchEvent calls
    phantomas.setMetric('eventsScrollBound'); // @desc number of scroll event bounds

    phantomas.on('init', function() {
        phantomas.evaluate(function() {
            (function(phantomas) {
                // spy calls to EventTarget.addEventListener
                // @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener
                function eventSpyBefore(eventType) {
                    /* jshint validthis: true */
                    var path = phantomas.getDOMPath(this);
                    //phantomas.log('DOM event: "' + eventType + '" bound to "' + path + '"');

                    phantomas.incrMetric('eventsBound');
                    phantomas.addOffender('eventsBound', '"%s" bound to "%s"', eventType, path);
                    phantomas.log('event ' + eventType + ' bound');

                    phantomas.enterContext({
                        type: 'addEventListener',
                        callDetails: {
                            context: {
                                length: 1,
                                elements: [path]
                            },
                            arguments: [eventType]
                        },
                        backtrace: phantomas.getBacktrace()
                    });

                    // count window.addEventListener('scroll', ...) - issue #508
                    if (eventType === 'scroll' && (path === 'window' || path === '#document')) {
                        phantomas.incrMetric('eventsScrollBound');
                        phantomas.addOffender('eventsScrollBound', 'bound by %s on %s', phantomas.getBacktrace(), path);
                    }
                }

                function eventSpyAfter(result) {
                    phantomas.leaveContext();
                }

                phantomas.spy(Element.prototype, 'addEventListener', eventSpyBefore, eventSpyAfter);
                phantomas.spy(Document.prototype, 'addEventListener', eventSpyBefore, eventSpyAfter);
                phantomas.spy(window, 'addEventListener', eventSpyBefore, eventSpyAfter);

                // spy calls to EventTarget.dispatchEvent
                // @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.dispatchEvent
                phantomas.spy(Element.prototype, 'dispatchEvent', function(ev) {
                    /* jshint validthis: true */
                    var path = phantomas.getDOMPath(this);

                    phantomas.log('Core JS event: triggered "%s" on "%s"', ev.type, path);

                    phantomas.incrMetric('eventsDispatched');
                    phantomas.addOffender('eventsDispatched', '"%s" on "%s"', ev.type, path);
                });
            })(window.__phantomas);
        });
    });

    phantomas.on('report', function() {
        phantomas.evaluate(function() {
            (function(phantomas) {
                // Check if a window.onscroll function is defined
                if (typeof(window.onscroll) === "function") {
                    phantomas.incrMetric('eventsScrollBound');
                    phantomas.addOffender('eventsScrollBound', 'bound by %s on %s', '', 'window.onscroll');
                }
            }(window.__phantomas));
        });
    });
};
