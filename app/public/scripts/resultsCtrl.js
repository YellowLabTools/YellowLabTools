var app = angular.module('Results', []);

app.controller('ResultsCtrl', function ($scope) {
    // Grab results from nodeJS served page
    $scope.phantomasResults = window._phantomas_results;

    $scope.view = 'execution';

    if ($scope.phantomasResults.metrics && $scope.phantomasResults.offenders && $scope.phantomasResults.offenders.javascriptExecutionTree) {

        // Get the execution tree from the offenders
        $scope.javascript = JSON.parse($scope.phantomasResults.offenders.javascriptExecutionTree);

        // Sort globalVariables offenders alphabetically
        if ($scope.phantomasResults.offenders.globalVariables) {
            $scope.phantomasResults.offenders.globalVariables.sort();
        }


        initSummaryView();
        initJSTimelineView();

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

        // If there are some CSS parsing errors, prepare the W3C CSS Validator direct URLs
        if ($scope.phantomasResults.offenders.cssParsingErrors) {
            $scope.cssW3cDirectUrls = [];
            $scope.phantomasResults.offenders.cssParsingErrors.forEach(function(errorString, index) {
                var stylesheet = errorString.split(' ')[0];
                var w3cUrl = 'http://jigsaw.w3.org/css-validator/validator?profile=css3&usermedium=all&warning=no&vextwarning=true&lang=en&uri=' + encodeURIComponent(stylesheet);
                $scope.cssW3cDirectUrls.push({
                    url: stylesheet,
                    w3c: w3cUrl
                });
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
        var numberOfIntervals = 199;
        var lastEvent = $scope.javascript.children[$scope.javascript.children.length - 1];
        $scope.endTime =  lastEvent.data.timestamp + (lastEvent.data.time || 0);
        $scope.timelineIntervalDuration = $scope.endTime / numberOfIntervals;
        
        // Pre-fill array of as many elements as there are milleseconds
        var millisecondsArray = Array.apply(null, new Array($scope.endTime + 1)).map(Number.prototype.valueOf,0);
        
        // Create the milliseconds array from the execution tree
        treeRunner($scope.javascript, function(node) {
            
            if (node.data.time !== undefined) {

                // Ignore artefacts (durations > 100ms)
                var time = Math.min(node.data.time, 100) || 1;

                for (var i=node.data.timestamp, max=node.data.timestamp + time ; i<max ; i++) {
                    millisecondsArray[i] |= 1;
                }
            }

            if (node.data.type !== 'main') {
                // Don't check the children
                return false;
            }
        });

        // Pre-fill array of 200 elements
        $scope.timeline = Array.apply(null, new Array(numberOfIntervals + 1)).map(Number.prototype.valueOf,0);

        // Create the timeline from the milliseconds array
        millisecondsArray.forEach(function(value, timestamp) {
            if (value === 1) {
                $scope.timeline[Math.floor(timestamp / $scope.timelineIntervalDuration)] += 1;
            }
        });
        
        // Get the maximum value of the array (needed for display)
        $scope.timelineMax = Math.max.apply(Math, $scope.timeline);
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
                    $scope.phantomasResults.metrics.DOMqueriesAvoidable * 2 +
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
                    $scope.phantomasResults.metrics.cssComplexSelectors * 5 +
                    $scope.phantomasResults.metrics.cssComplexSelectorsByAttribute * 10;
        if (score > 800) {
            note = 'B';
        }
        if (score > 1200) {
            note = 'C';
        }
        if (score > 2500) {
            note = 'D';
        }
        if (score > 4000) {
            note = 'E';
        }
        if (score > 6000) {
            note = 'F';
        }
        return note;
    }

    function getBadCssScore() {
        if (!$scope.phantomasResults.metrics.cssRules) {
            return 'NA';
        }

        var note = 'A';
        var score = $scope.phantomasResults.metrics.cssDuplicatedSelectors +
                    $scope.phantomasResults.metrics.cssDuplicatedProperties +
                    $scope.phantomasResults.metrics.cssEmptyRules +
                    $scope.phantomasResults.metrics.cssExpressions * 10 +
                    $scope.phantomasResults.metrics.cssImportants * 2 +
                    $scope.phantomasResults.metrics.cssOldIEFixes * 10 +
                    $scope.phantomasResults.metrics.cssOldPropertyPrefixes +
                    $scope.phantomasResults.metrics.cssUniversalSelectors * 5 +
                    $scope.phantomasResults.metrics.cssRedundantBodySelectors * 0.5 +
                    $scope.phantomasResults.metrics.cssRedundantChildNodesSelectors * 0.5 +
                    $scope.phantomasResults.metrics.cssImports * 50;
        if (score > 50) {
            note = 'B';
        }
        if (score > 100) {
            note = 'C';
        }
        if (score > 200) {
            note = 'D';
        }
        if (score > 500) {
            note = 'E';
        }
        if (score > 1000) {
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