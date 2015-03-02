/**
 * Analyzes events bound to DOM elements
 */
/* global Document: true, Element: true, window: true */

exports.version = '0.2.a';

exports.module = function(phantomas) {
    'use strict';
    
    phantomas.setMetric('eventsBound'); // @desc number of EventTarget.addEventListener calls

    // spy calls to EventTarget.addEventListener
    // @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener
    phantomas.once('init', function() {
        phantomas.evaluate(function() {
            (function(phantomas) {
                function eventSpyBefore(eventType) {
                    /* jshint validthis: true */
                    var path = phantomas.getDOMPath(this);
                    //phantomas.log('DOM event: "' + eventType + '" bound to "' + path + '"');

                    phantomas.incrMetric('eventsBound');
                    phantomas.addOffender('eventsBound', '"%s" bound to "%s"', eventType, path);

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
                }

                function eventSpyAfter(result) {
                    phantomas.leaveContext();
                }

                phantomas.spy(Element.prototype, 'addEventListener', eventSpyBefore, eventSpyAfter);
                phantomas.spy(Document.prototype, 'addEventListener', eventSpyBefore, eventSpyAfter);
                phantomas.spy(window, 'addEventListener', eventSpyBefore, eventSpyAfter);
            })(window.__phantomas);
        });
    });
};
