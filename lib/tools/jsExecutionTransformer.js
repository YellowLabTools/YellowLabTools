var debug = require('debug')('ylt:jsExecutionTransformer');

var offendersHelpers    = require('../offendersHelpers');
var Collection          = require('./phantomas/custom_modules/util/collection');

var jsExecutionTransformer = function() {

    this.transform = function(data) {
        var javascriptExecutionTree = {};
        var scrollExecutionTree = {};
        var jQueryFunctionsCollection = new Collection();
        
        var metrics = {
            DOMaccesses: 0,
            DOMaccessesOnScroll: 0,
            queriesWithoutResults: 0,
            jQueryCalls: 0,
            jQueryCallsOnEmptyObject: 0,
            jQueryNotDelegatedEvent: 0
        };

        var offenders = {

        };

        try {

            debug('Starting JS execution transformation');
            javascriptExecutionTree = JSON.parse(data.toolsResults.phantomas.offenders.javascriptExecutionTree[0]);
        
            if (javascriptExecutionTree.children) {
                javascriptExecutionTree.children.forEach(function(node) {
                    
                    var contextLenght = (node.data.callDetails && node.data.callDetails.context) ? node.data.callDetails.context.length : null;

                    if ((node.data.type === 'jQuery - bind' || node.data.type === 'jQuery - on') && contextLenght > 3) {
                        metrics.jQueryNotDelegatedEvent += contextLenght - 1;
                        node.warning = true;
                    }

                    if (node.data.resultsNumber === 0) {
                        metrics.queriesWithoutResults ++;
                        node.warning = true;
                    }

                    if (contextLenght === 0) {
                        metrics.jQueryCallsOnEmptyObject ++;
                        node.warning = true;
                    }

                    if (node.data.type.indexOf('jQuery - ') === 0) {
                        metrics.jQueryCalls ++;
                        jQueryFunctionsCollection.push(node.data.type);
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

                    // Transform domPaths into objects
                    changeListOfDomPaths(node);

                    // Count the number of DOM accesses, by counting the tree leafs
                    metrics.DOMaccesses += countTreeLeafs(node);
                });

                // Count the number of different jQuery functions called
                if (data.toolsResults.phantomas.metrics.jQueryVersionsLoaded) {
                    metrics.jQueryFunctionsUsed = 0;
                    offenders.jQueryFunctionsUsed = [];

                    jQueryFunctionsCollection.sort().forEach(function(fnName, cnt) {
                        if (fnName === 'jQuery - find') {
                            fnName = 'jQuery - $';
                        }
                        metrics.jQueryFunctionsUsed ++;
                        offenders.jQueryFunctionsUsed.push({
                            functionName: fnName.substring(9),
                            count: cnt
                        });
                    });
                }

            }
            debug('JS execution transformation complete');


            debug('Starting scroll execution transformation');
            offenders.scrollExecutionTree = JSON.parse(data.toolsResults.phantomas.offenders.scrollExecutionTree[0]);
            if (offenders.scrollExecutionTree.children) {
                offenders.scrollExecutionTree.children.forEach(function(node) {
                    
                    // Mark a event flag
                    if (['documentScroll', 'windowScroll', 'window.onscroll'].indexOf(node.data.type) >= 0) {
                        node.windowPerformance = true;
                    }

                    // Transform domPaths into objects
                    changeListOfDomPaths(node);
                    
                    // Count the number of DOM accesses, by counting the tree leafs
                    metrics.DOMaccessesOnScroll += countTreeLeafs(node);
                });
            }
            debug('Scroll execution transformation complete');

        } catch(err) {
            throw err;
        }

        data.javascriptExecutionTree = javascriptExecutionTree;
        
        data.toolsResults.jsExecutionTransformer = {
            metrics: metrics,
            offenders: offenders
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

    function changeListOfDomPaths(rootNode) {
        treeRecursiveParser(rootNode, function(node) {
            
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
    }

    // Returns the number of leafs (nodes without children)
    function countTreeLeafs(rootNode) {
        var count = 0;

        treeRecursiveParser(rootNode, function(node) {
            if (!node.children &&
                !node.error &&
                !node.windowPerformance &&
                node.data.type !== 'jQuery loaded') {
                count ++;
            }
        });

        return count;
    }
};

module.exports = new jsExecutionTransformer();