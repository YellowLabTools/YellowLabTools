var debug = require('debug')('ylt:jsExecutionTransformer');

var offendersHelpers = require('../offendersHelpers');

var jsExecutionTransformer = function() {

    this.transform = function(data) {
        var javascriptExecutionTree = {};
        
        var metrics = {
            domManipulations: 0,
            queriesWithoutResults: 0,
            jQueryCalls: 0,
            jQueryCallsOnEmptyObject: 0
            
        };

        debug('Starting JS execution transformation');

        try {
            javascriptExecutionTree = JSON.parse(data.toolsResults.phantomas.offenders.javascriptExecutionTree[0]);
        
            if (javascriptExecutionTree.children) {
                javascriptExecutionTree.children.forEach(function(node) {
                    
                    // Mark abnormal things with a warning flag
                    var contextLenght = (node.data.callDetails && node.data.callDetails.context) ? node.data.callDetails.context.length : null;
                    if ((node.data.type === 'jQuery - bind' && contextLenght > 5) ||
                            node.data.resultsNumber === 0 ||
                            contextLenght === 0) {
                        node.warning = true;
                    }

                    // Mark errors with an error flag
                    if (node.data.type === 'error' || node.data.type === 'jQuery version change') {
                        node.error = true;
                    }

                    // Mark a performance flag
                    if (['domInteractive', 'domContentLoaded', 'domContentLoadedEnd', 'domComplete'].indexOf(node.data.type) >= 0) {
                        node.windowPerformance = true;
                    }

                    // Read the execution tree and adjust the navigation timings (cause their not very well synchronised)
                    switch(node.data.type) {
                        case 'domInteractive':
                            data.toolsResults.phantomas.metrics.domInteractive = node.data.timestamp;
                            break;
                        case 'domContentLoaded':
                            data.toolsResults.phantomas.metrics.domContentLoaded = node.data.timestamp;
                            break;
                        case 'domContentLoadedEnd':
                            data.toolsResults.phantomas.metrics.domContentLoadedEnd = node.data.timestamp;
                            break;
                        case 'domComplete':
                            data.toolsResults.phantomas.metrics.domComplete = node.data.timestamp;
                            break;
                    }

                    // Change the list of dom paths into a tree
                    treeRecursiveParser(node, function(node) {
                        
                        if (node.data.callDetails && node.data.callDetails.context && node.data.callDetails.context.length > 0) {
                            node.data.callDetails.context.elements = node.data.callDetails.context.elements.map(offendersHelpers.domPathToDomElementObj, offendersHelpers);
                        }

                        if (node.data.type === 'appendChild' || node.data.type === 'insertBefore' || node.data.type === 'getComputedStyle') {
                            node.data.callDetails.arguments[0] = offendersHelpers.domPathToDomElementObj(node.data.callDetails.arguments[0]);
                        }

                        if (node.data.type === 'insertBefore') {
                            node.data.callDetails.arguments[1] = offendersHelpers.domPathToDomElementObj(node.data.callDetails.arguments[1]);
                        }
                    });
                });
            }

            debug('JS execution transformation complete');

        } catch(err) {
            throw err;
        }

        data.javascriptExecutionTree = javascriptExecutionTree;
        data.toolsResults.jsExecutionTransformer = {
            metrics: metrics
        };

        return data;
    };

    function treeRecursiveParser(node, fn) {
        if (node.children) {
            node.children.forEach(function(child) {
                treeRecursiveParser(child, fn);
            });
        }
        fn(node);
    }
};

module.exports = new jsExecutionTransformer();