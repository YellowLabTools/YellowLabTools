var ruleCtrl = angular.module('ruleCtrl', ['chart.js']);

ruleCtrl.config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all charts
    ChartJsProvider.setOptions({
        animation: false,
        colours: ['#FF5252', '#FF8A80'],
        responsive: true
    });
}]);

ruleCtrl.controller('RuleCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$sce', 'Menu', 'Results', 'API', function($scope, $rootScope, $routeParams, $location, $sce, Menu, Results, API) {
    $scope.runId = $routeParams.runId;
    $scope.policyName = $routeParams.policy;
    $scope.Menu = Menu.setCurrentPage(null, $scope.runId);
    $scope.rule = null;

    function loadResults() {
        // Load result if needed
        if (!$rootScope.loadedResult || $rootScope.loadedResult.runId !== $routeParams.runId) {
            Results.get({runId: $routeParams.runId, exclude: 'toolsResults'}, function(result) {
                $rootScope.loadedResult = result;
                $scope.result = result;
                init();
            });
        } else {
            $scope.result = $rootScope.loadedResult;
            init();
        }
    }

    function init() {
        $scope.rule = $scope.result.rules[$scope.policyName];

        // Init "Total Weight" chart
        if ($scope.policyName === 'totalWeight') {
            $scope.weightLabels = [];
            $scope.weightColours = ['#7ECCCC', '#A7E846', '#FF944D', '#FFE74A', '#C2A3FF', '#5A9AED', '#FF6452', '#C1C1C1'];
            $scope.weightData = [];

            var types = ['html', 'css', 'js', 'json', 'image', 'video', 'webfont', 'other'];
            types.forEach(function(type) {
                $scope.weightLabels.push(type);
                $scope.weightData.push(Math.round($scope.rule.offendersObj.list.byType[type].totalWeight / 1024));
            });

            $scope.weightOptions = {
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var label = data.labels[tooltipItem.index];
                            var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return label + ': ' + value + ' KB';
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        fontSize: 14
                    }
                }
            };
        }
    }

    $scope.backToDashboard = function() {
        $location.path('/result/' + $scope.runId);
    };

    $scope.testAgain = function() {
        API.relaunchTest($scope.result);
    };

    loadResults();
}]);