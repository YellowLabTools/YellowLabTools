var app = angular.module('Results', []);

app.controller('ResultsCtrl', function ($scope) {
    // Grab results from nodeJS served page
    $scope.phantomasResults = window._phantomas_results;
    $scope.phantomasMetadata = window._phantomas_metadata.metrics;

    $scope.view = 'summary';

    if ($scope.phantomasResults.metrics && $scope.phantomasResults.offenders && $scope.phantomasResults.offenders.javascriptExecutionTree) {

        // Get the execution tree from the offenders
        $scope.javascript = JSON.parse($scope.phantomasResults.offenders.javascriptExecutionTree);

        initSummaryView();
        initExecutionView();
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
        treeRunner($scope.javascript, function(node) {
            if (node.data.time) {
                $scope.totalJSTime += node.data.time;
            }
            
            if (node.data.type !== 'main') {
                // Don't check the children
                return false;
            }
        });

        // Read all the duplicated queries and calculate a more appropriated score
        $scope.duplicatedQueriesCountAll = 0;
        if ($scope.phantomasResults.offenders.DOMqueriesDuplicated) {
            var regex = /^{.*}: (\d+) queries$/;
            $scope.phantomasResults.offenders.DOMqueriesDuplicated.forEach(function(query) {
                $scope.duplicatedQueriesCountAll += parseInt(regex.exec(query)[1], 10);
            });
        }

        $scope.notations = {
            domComplexity: 'A',
            domManipulations: 'A',
            duplicatedDomQueries: 'A',
            badPractices: 'A'
        };

        var domComplexityScore = $scope.phantomasResults.metrics.DOMelementsCount
                               + Math.sqrt($scope.phantomasResults.metrics.DOMelementMaxDepth)
                               + $scope.phantomasResults.metrics.iframesCount * 100;
        if (domComplexityScore > 1000) {
            $scope.notations.domComplexity = 'B';
        }
        if (domComplexityScore > 1500) {
            $scope.notations.domComplexity = 'C';
        }
        if (domComplexityScore > 2500) {
            $scope.notations.domComplexity = 'D';
        }
        if (domComplexityScore > 3500) {
            $scope.notations.domComplexity = 'E';
        }
        if (domComplexityScore > 5000) {
            $scope.notations.domComplexity = 'F';
        }

        var domManipulationsScore = $scope.phantomasResults.metrics.DOMinserts
                                  + $scope.phantomasResults.metrics.DOMqueries * 0.5
                                  + $scope.totalJSTime;
        if (domManipulationsScore > 100) {
            $scope.notations.domManipulations = 'B';
        }
        if (domManipulationsScore > 200) {
            $scope.notations.domManipulations = 'C';
        }
        if (domManipulationsScore > 300) {
            $scope.notations.domManipulations = 'D';
        }
        if (domManipulationsScore > 500) {
            $scope.notations.domManipulations = 'E';
        }
        if (domManipulationsScore > 800) {
            $scope.notations.domManipulations = 'F';
        }

        var duplicatedDomQueries = $scope.duplicatedQueriesCountAll;
        if (duplicatedDomQueries > 20) {
            $scope.notations.duplicatedDomQueries = 'B';
        }
        if (duplicatedDomQueries > 50) {
            $scope.notations.duplicatedDomQueries = 'C';
        }
        if (duplicatedDomQueries > 100) {
            $scope.notations.duplicatedDomQueries = 'D';
        }
        if (duplicatedDomQueries > 200) {
            $scope.notations.duplicatedDomQueries = 'E';
        }
        if (duplicatedDomQueries > 500) {
            $scope.notations.duplicatedDomQueries = 'F';
        }

        var badPracticesScore = $scope.phantomasResults.metrics.documentWriteCalls * 3
                              + $scope.phantomasResults.metrics.evalCalls * 3
                              + $scope.phantomasResults.metrics.jsErrors * 10
                              + $scope.phantomasResults.metrics.consoleMessages;
        if (badPracticesScore > 5) {
            $scope.notations.badPractices = 'B';
        }
        if (badPracticesScore > 10) {
            $scope.notations.badPractices = 'C';
        }
        if (badPracticesScore > 15) {
            $scope.notations.badPractices = 'D';
        }
        if (badPracticesScore > 25) {
            $scope.notations.badPractices = 'E';
        }
        if (badPracticesScore > 40) {
            $scope.notations.badPractices = 'F';
        }
    }

    function initExecutionView() {
        $scope.slowRequestsOn = false;
        $scope.slowRequestsLimit = 5;
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