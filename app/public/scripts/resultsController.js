var app = angular.module('Results', []);

app.controller('ResultsCtrl', function ($scope) {
    // Grab results from nodeJS served page
    $scope.phantomasResults = window._phantomas_results;

    $scope.slowRequestsOn = false;
    $scope.slowRequestsLimit = 5;

    if ($scope.phantomasResults.offenders && $scope.phantomasResults.offenders.javascriptExecutionTree) {
        $scope.javascript = JSON.parse($scope.phantomasResults.offenders.javascriptExecutionTree);
    }

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

});