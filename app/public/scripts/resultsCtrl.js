var app = angular.module('Results', []);

app.controller('ResultsCtrl', function ($scope) {
    // Grab results from nodeJS served page
    $scope.phantomasResults = window._phantomas_results;
    $scope.phantomasMetadata = window._phantomas_metadata.metrics;

    $scope.view = 'summary';

    if ($scope.phantomasResults.metrics && $scope.phantomasResults.offenders && $scope.phantomasResults.offenders.javascriptExecutionTree) {

        // Get the execution tree from the offenders
        $scope.javascript = JSON.parse($scope.phantomasResults.offenders.javascriptExecutionTree);

        // Sort globalVariables offenders alphabetically
        $scope.phantomasResults.offenders.globalVariables.sort();


        initSummaryView();
        initJSTimelineView();
        initMetricsView();

    }

    $scope.setView = function(viewName) {
        $scope.view = viewName;
    };

    $scope.onNodeDetailsClick = function(node) {
        var isOpen = node.data.showDetails;
        if (!isOpen) {
            // Close all other nodes
            $scope.javascript.children.forEach(function(currentNode) {
                currentNode.data.showDetails = false;
            });

            // Parse the backtrace
            if (!node.data.parsedBacktrace) {
                node.data.parsedBacktrace = parseBacktrace(node.data.backtrace);
            }

        }
        node.data.showDetails = !isOpen;
    };

    function initSummaryView() {

        // Read the main elements of the tree and sum the total time
        $scope.totalJSTime = 0;
        $scope.inBodyDomManipulations = 0;
        treeRunner($scope.javascript, function(node) {
            if (node.data.time) {
                $scope.totalJSTime += node.data.time;
            }

            if (node.data.timestamp < $scope.phantomasResults.metrics.domInteractive &&
                    node.data.type !== 'jQuery - onDOMReady') {
                $scope.inBodyDomManipulations ++;
            }
            
            if (node.data.type !== 'main') {
                // Don't check the children
                return false;
            }
        });

        // Read all the duplicated queries and calculate a more appropriated score
        $scope.duplicatedQueriesCountAll = 0;
        if ($scope.phantomasResults.offenders.DOMqueriesDuplicated) {
            var regex = /\): *(\d+) queries$/;
            $scope.phantomasResults.offenders.DOMqueriesDuplicated.forEach(function(query) {
                var regexResult = regex.exec(query);
                if (regexResult) {
                    $scope.duplicatedQueriesCountAll += parseInt(regexResult[1], 10) - 1;
                }
            });
        }

        // Grab the notes
        $scope.notations = {
            domComplexity: getDomComplexityScore(),
            jsDomManipulations: getJsDomManipulationsScore(),
            jsBadPractices: getJSBadPracticesScore(),
            jQueryLoading: getJQueryLoadingScore(),
            cssComplexity: getCSSComplexityScore(),
            badCss: getBadCssScore(),
            requests: requestsScore(),
            network: networkScore()
        };
    }

    function initJSTimelineView() {
        $scope.slowRequestsOn = false;
        $scope.slowRequestsLimit = 5;

        if (!$scope.javascript.children) {
            return;
        }

        // Read the execution tree and adjust the navigation timings (cause their not very well synchronised)
        treeRunner($scope.javascript, function(node) {
            switch(node.data.type) {
                case 'domInteractive':
                    $scope.phantomasResults.metrics.domInteractive = node.data.timestamp;
                    break;
                case 'domContentLoaded':
                    $scope.phantomasResults.metrics.domContentLoaded = node.data.timestamp;
                    break;
                case 'domContentLoadedEnd':
                    $scope.phantomasResults.metrics.domContentLoadedEnd = node.data.timestamp;
                    break;
                case 'domComplete':
                    $scope.phantomasResults.metrics.domComplete = node.data.timestamp;
                    break;
            }

            if (node.data.type !== 'main') {
                // Don't check the children
                return false;
            }
        });


        // Now read the tree and display it on a timeline
        
        // Split the timeline into 200 intervals
        var numberOfIntervals = 200;
        var lastEvent = $scope.javascript.children[$scope.javascript.children.length - 1];
        $scope.endTime =  lastEvent.data.timestamp + (lastEvent.data.time || 0);
        $scope.timelineIntervalDuration = $scope.endTime / numberOfIntervals;
        
        // Pre-filled array of 100 elements
        $scope.timeline = Array.apply(null, new Array(numberOfIntervals)).map(Number.prototype.valueOf,0);

        treeRunner($scope.javascript, function(node) {
            
            if (node.data.time) {
                
                // If a node is between two intervals, split it. That's the meaning of the following dirty algorithm.

                var startInterval = Math.floor(node.data.timestamp / $scope.timelineIntervalDuration);
                var endInterval = Math.floor((node.data.timestamp + node.data.time) / $scope.timelineIntervalDuration);

                if (startInterval === endInterval) {
                    
                    $scope.timeline[startInterval] += node.data.time;

                } else {
                    
                    var timeToDispatch = node.data.time;
                    
                    var startIntervalPart = ((startInterval + 1) * $scope.timelineIntervalDuration) - node.data.timestamp;
                    $scope.timeline[startInterval] += startIntervalPart;
                    timeToDispatch -= startIntervalPart;
                    
                    var currentInterval = startInterval;
                    while(currentInterval < endInterval && currentInterval + 1 < numberOfIntervals) {
                        currentInterval ++;
                        var currentIntervalPart = Math.min(timeToDispatch, $scope.timelineIntervalDuration);
                        $scope.timeline[currentInterval] = currentIntervalPart;
                        timeToDispatch -= currentIntervalPart;
                    }
                }
            }
            
            if (node.data.type !== 'main') {
                // Don't check the children
                return false;
            }
        });
        $scope.timelineMax = Math.max.apply(Math, $scope.timeline);
    }

    function initMetricsView() {
        // Get the Phantomas modules from metadata
        $scope.metricsModule = {};
        for (var metricName in $scope.phantomasMetadata) {
            var metric = $scope.phantomasMetadata[metricName];
            if (!$scope.metricsModule[metric.module]) {
                $scope.metricsModule[metric.module] = {};
            }
            $scope.metricsModule[metric.module][metricName] = metric;
        }
    }


    function getDomComplexityScore() {
        var note = 'A';
        var score = $scope.phantomasResults.metrics.DOMelementsCount +
                    Math.pow($scope.phantomasResults.metrics.DOMelementMaxDepth, 2) +
                    $scope.phantomasResults.metrics.iframesCount * 50 +
                    $scope.phantomasResults.metrics.DOMidDuplicated * 25;
        if (score > 1000) {
            note = 'B';
        }
        if (score > 1500) {
            note = 'C';
        }
        if (score > 2000) {
            note = 'D';
        }
        if (score > 3000) {
            note = 'E';
        }
        if (score > 4000) {
            note = 'F';
        }
        return note;
    }

    function getJsDomManipulationsScore() {
        var note = 'A';
        var score = $scope.phantomasResults.metrics.DOMinserts * 2 +
                    $scope.phantomasResults.metrics.DOMqueries +
                    $scope.duplicatedQueriesCountAll * 2 +
                    $scope.phantomasResults.metrics.eventsBound;
        if (score > 300) {
            note = 'B';
        }
        if (score > 500) {
            note = 'C';
        }
        if (score > 700) {
            note = 'D';
        }
        if (score > 1000) {
            note = 'E';
        }
        if (score > 1400) {
            note = 'F';
        }
        return note;
    }

    function getJSBadPracticesScore() {
        var note = 'A';
        var score = $scope.phantomasResults.metrics.documentWriteCalls * 3 +
                    $scope.phantomasResults.metrics.evalCalls * 2 +
                    $scope.phantomasResults.metrics.jsErrors * 10 +
                    $scope.phantomasResults.metrics.consoleMessages / 2 +
                    $scope.phantomasResults.metrics.globalVariables / 20 +
                    Math.sqrt($scope.inBodyDomManipulations);
        if (score > 10) {
            note = 'B';
        }
        if (score > 15) {
            note = 'C';
        }
        if (score > 20) {
            note = 'D';
        }
        if (score > 30) {
            note = 'E';
        }
        if (score > 45) {
            note = 'F';
        }
        return note;
    }

    function getJQueryLoadingScore() {
        var note = 'NA';
        if ($scope.phantomasResults.metrics.jQueryDifferentVersions > 1) {
            note = 'F';
        } else if ($scope.phantomasResults.metrics.jQueryVersion) {
            if ($scope.phantomasResults.metrics.jQueryVersion.indexOf('1.11.') === 0 ||
                $scope.phantomasResults.metrics.jQueryVersion.indexOf('1.12.') === 0 ||
                $scope.phantomasResults.metrics.jQueryVersion.indexOf('2.1.') === 0 ||
                $scope.phantomasResults.metrics.jQueryVersion.indexOf('2.2.') === 0) {
                note = 'A';
            } else if ($scope.phantomasResults.metrics.jQueryVersion.indexOf('1.9.') === 0 ||
                       $scope.phantomasResults.metrics.jQueryVersion.indexOf('1.10.') === 0 ||
                       $scope.phantomasResults.metrics.jQueryVersion.indexOf('2.0.') === 0) {
                note = 'B';
            } else if ($scope.phantomasResults.metrics.jQueryVersion.indexOf('1.7.') === 0 ||
                       $scope.phantomasResults.metrics.jQueryVersion.indexOf('1.8.') === 0) {
                note = 'C';
            } else if ($scope.phantomasResults.metrics.jQueryVersion.indexOf('1.5.') === 0 ||
                       $scope.phantomasResults.metrics.jQueryVersion.indexOf('1.6.') === 0) {
                note = 'D';
            } else if ($scope.phantomasResults.metrics.jQueryVersion.indexOf('1.2.') === 0 ||
                       $scope.phantomasResults.metrics.jQueryVersion.indexOf('1.3.') === 0 ||
                       $scope.phantomasResults.metrics.jQueryVersion.indexOf('1.4.') === 0) {
                note = 'E';
            }
        }
        return note;
    }

    function getCSSComplexityScore() {
        if (!$scope.phantomasResults.metrics.cssRules) {
            return 'NA';
        }

        var note = 'A';
        var score = $scope.phantomasResults.metrics.cssRules +
                    $scope.phantomasResults.metrics.cssComplexSelectors * 10;
        if (score > 500) {
            note = 'B';
        }
        if (score > 1000) {
            note = 'C';
        }
        if (score > 2000) {
            note = 'D';
        }
        if (score > 4500) {
            note = 'E';
        }
        if (score > 7000) {
            note = 'F';
        }
        return note;
    }

    function getBadCssScore() {
        if ($scope.phantomasResults.metrics.cssParsingErrors) {
            return 'F';
        } else if (!$scope.phantomasResults.metrics.cssRules) {
            return 'NA';
        }

        var note = 'A';
        var score = $scope.phantomasResults.metrics.cssDuplicatedSelectors +
                    $scope.phantomasResults.metrics.cssEmptyRules +
                    $scope.phantomasResults.metrics.cssExpressions * 10 +
                    $scope.phantomasResults.metrics.cssImportants * 2 +
                    $scope.phantomasResults.metrics.cssOldIEFixes * 10 +
                    $scope.phantomasResults.metrics.cssOldPropertyPrefixes +
                    $scope.phantomasResults.metrics.cssUniversalSelectors * 5 +
                    $scope.phantomasResults.metrics.cssRedundantBodySelectors;
        if (score > 20) {
            note = 'B';
        }
        if (score > 50) {
            note = 'C';
        }
        if (score > 100) {
            note = 'D';
        }
        if (score > 200) {
            note = 'E';
        }
        if (score > 500) {
            note = 'F';
        }
        return note;
    }

    function requestsScore() {
        var note = 'A';
        var score = $scope.phantomasResults.metrics.requests;
        if (score > 30) {
            note = 'B';
        }
        if (score > 45) {
            note = 'C';
        }
        if (score > 60) {
            note = 'D';
        }
        if (score > 80) {
            note = 'E';
        }
        if (score > 100) {
            note = 'F';
        }
        return note;
    }

    function networkScore() {
        var note = 'A';
        var score = $scope.phantomasResults.metrics.notFound * 25 +
                    $scope.phantomasResults.metrics.closedConnections * 10 +
                    $scope.phantomasResults.metrics.multipleRequests * 10 +
                    $scope.phantomasResults.metrics.cachingDisabled * 2 +
                    $scope.phantomasResults.metrics.cachingNotSpecified +
                    $scope.phantomasResults.metrics.cachingTooShort / 2 +
                    $scope.phantomasResults.metrics.domains;
        if (score > 20) {
            note = 'B';
        }
        if (score > 40) {
            note = 'C';
        }
        if (score > 60) {
            note = 'D';
        }
        if (score > 80) {
            note = 'E';
        }
        if (score > 100) {
            note = 'F';
        }
        return note;
    }



    function parseBacktrace(str) {
        if (!str) {
            return null;
        }

        var out = [];
        var splited = str.split(' / ');
        splited.forEach(function(trace) {
            var result = /^(\S*)\s?\(?(https?:\/\/\S+):(\d+)\)?$/g.exec(trace);
            if (result && result[2].length > 0) {
                var filePath = result[2];
                var chunks = filePath.split('/');
                var fileName = chunks[chunks.length - 1];

                out.push({
                    fnName: result[1],
                    fileName: fileName,
                    filePath: filePath,
                    line: result[3]
                });
            }
        });
        return out;
    }

    // Goes on every node of the tree and calls the function fn. If fn returns false on a node, its children won't be checked.
    function treeRunner(node, fn) {
        if (fn(node) !== false && node.children) {
            node.children.forEach(function(child) {
                treeRunner(child, fn);
            });
        }
    }

});