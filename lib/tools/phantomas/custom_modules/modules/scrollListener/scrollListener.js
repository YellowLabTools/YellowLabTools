exports.version = '0.1';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('scrollExecutionTree');

    phantomas.on('report', function() {

        phantomas.evaluate(function() {
            (function(phantomas) {

                var evt = document.createEvent('CustomEvent');
                evt.initCustomEvent('scroll', false, false, null);

                function triggerScrollEvent() {
                    phantomas.resetTree();

                    try {

                        // Chrome triggers them in this order:

                        // 1. document
                        phantomas.pushContext({
                            type: 'documentScroll'
                        });
                        document.dispatchEvent(evt);

                        // 2. window
                        phantomas.pushContext({
                            type: 'windowScroll'
                        });
                        window.dispatchEvent(evt);

                        // No need to call window.onscroll(), it's called by the scroll event on window

                    } catch(e) {
                        phantomas.log('ScrollListener error: %s', e);
                    }
                }

                var firstScrollTime = Date.now();
                phantomas.log('ScrollListener: triggering a first scroll event...');
                triggerScrollEvent();


                // Ignore the first scroll event and only save the second one,
                // because we want to detect un-throttled things, throttled ones are ok.
                var secondScrollTime = Date.now();
                phantomas.log('ScrollListener: triggering a second scroll event (%dms after the first)...', secondScrollTime - firstScrollTime);
                triggerScrollEvent();


                var fullTree = phantomas.readFullTree();
                if (fullTree !== null) {
                    phantomas.setMetric('scrollExecutionTree', true, true);
                    phantomas.addOffender('scrollExecutionTree', JSON.stringify(fullTree));
                    phantomas.log('ScrollListener: scrollExecutionTree correctly extracted');
                } else {
                    phantomas.log('Error: scrollExecutionTree could not be extracted');
                }


                phantomas.log('ScrollListener: end of scroll triggering');

            })(window.__phantomas);
        });
    });
};
