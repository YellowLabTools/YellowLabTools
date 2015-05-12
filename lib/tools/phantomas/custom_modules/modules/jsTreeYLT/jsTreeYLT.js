/**
 * Saves the javascript interractions with the DOM
 *
 * Run phantomas with --js-execution-tree option to use this module
 */

exports.version = '0.1';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('javascriptExecutionTree');

    // save data
    phantomas.on('report', function() {
        phantomas.log('JS execution tree: Reading execution tree JSON');

        phantomas.evaluate(function() {(function(phantomas) {
            var fullTree = phantomas.readFullTree();

            if (fullTree === null) {
                phantomas.log('JS execution tree: error, the execution tree is not correctly closed');
                return;
            }

            phantomas.setMetric('javascriptExecutionTree', true, true);
            phantomas.addOffender('javascriptExecutionTree', JSON.stringify(fullTree));

        })(window.__phantomas);});
    });
};
