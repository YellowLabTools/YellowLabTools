var debug = require('debug')('ylt:jsExecutionTransformer');

var offendersHelpers    = require('../offendersHelpers');
var Collection          = require('./phantomas/custom_modules/util/collection');

var jsExecutionTransformer = function() {

    this.transform = function(data) {
        var javascriptExecutionTree = {};
        var jQueryFunctionsCollection = new Collection();
        
        var metrics = {
            domInteractive: 0,
            domContentLoaded: 0,
            domContentLoadedEnd: 0,
            domComplete: 0,

            DOMaccesses: 0,
            DOMaccessesOnScroll: 0,
            queriesWithoutResults: 0
        };

        var offenders = {};

        var hasjQuery = (data.toolsResults.phantomas.metrics.jQueryVersionsLoaded > 0);
        if (hasjQuery) {
            metrics.jQueryCalls = 0;
            metrics.jQueryCallsOnEmptyObject = 0;
            metrics.jQueryNotDelegatedEvents = 0;
        }

        try {

            debug('Starting JS execution transformation');
            javascriptExecutionTree = JSON.parse(data.toolsResults.phantomas.offenders.javascriptExecutionTree[0]);
        
            if (javascriptExecutionTree.children) {
                javascriptExecutionTree.children.forEach(function(node, index) {
                    
                    var contextLength = (node.data.callDetails && node.data.callDetails.context) ? node.data.callDetails.context.length : null;

                    if (isABindWithoutEventDelegation(node, contextLength)) {
                        metrics.jQueryNotDelegatedEvents += contextLength;
                        node.warning = true;
                        node.eventNotDelegated = true;
                    }

                    if (node.data.resultsNumber === 0) {
                        metrics.queriesWithoutResults ++;
                        node.queryWithoutResults = true;
                        node.warning = true;
                    }

                    if (contextLength === 0) {
                        metrics.jQueryCallsOnEmptyObject ++;
                        node.jQueryCallOnEmptyObject = true;
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

                        // Adjust the navigation timings (cause their not very well synchronised)
                        switch(node.data.type) {
                            case 'domInteractive':
                                javascriptExecutionTree.data.domInteractive = node.data.timestamp;
                                break;
                            case 'domContentLoaded':
                                javascriptExecutionTree.data.domContentLoaded = node.data.timestamp;
                                break;
                            case 'domContentLoadedEnd':
                                javascriptExecutionTree.data.domContentLoadedEnd = node.data.timestamp;
                                break;
                            case 'domComplete':
                                javascriptExecutionTree.data.domComplete = node.data.timestamp;
                                break;
                        }
                    }
                    // Fix rare bug when domComplete was never triggered
                    if (index === javascriptExecutionTree.children.length - 1 && !javascriptExecutionTree.data.domComplete) {
                        javascriptExecutionTree.data.domComplete = node.data.timestamp + 1000;
                    }

                    // Transform domPaths into objects
                    changeListOfDomPaths(node);

                    // Count the number of DOM accesses, by counting the tree leafs
                    metrics.DOMaccesses += countTreeLeafs(node);
                });

            }
            debug('JS execution transformation complete');


            if (data.toolsResults.phantomas.offenders.scrollExecutionTree) {
                debug('Starting scroll execution transformation');
                offenders.DOMaccessesOnScroll = JSON.parse(data.toolsResults.phantomas.offenders.scrollExecutionTree[0]);
                if (offenders.DOMaccessesOnScroll.children) {
                    offenders.DOMaccessesOnScroll.children.forEach(function(node) {
                        
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
            } else {
                debug('Could not parse scrollExecutionTree');
            }

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

    function isPureString(str) {
        return typeof str === 'string' && str[0] !== '{' && str !== '(function)' && str !== '[Object]' && str !== '[Array]' && str !== 'true' && str !== 'false' && str !== 'undefined' && str !== 'unknown' && str !== 'null';
    }

    function isABindWithoutEventDelegation(node, contextLength) {
        // Count only on larger bindings
        if (contextLength <= 3) {
            return false;
        }

        if (node.data.type === 'jQuery - on' && node.data.callDetails.arguments[1] && !isPureString(node.data.callDetails.arguments[1])) {
            return true;
        }

        if (node.data.type.indexOf('jQuery - ') === 0 && node.children && node.children.length === 1) {
            var child = node.children[0];
            if (child.data.type === 'jQuery - on' && child.data.callDetails.arguments[1] && !isPureString(child.data.callDetails.arguments[1])) {
                return true;
            }
        }

        return false;
    }
};

module.exports = new jsExecutionTransformer();