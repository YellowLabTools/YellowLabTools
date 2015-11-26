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
                tooltipTemplate: '<%=label%>: <%=value%> KB'
            };
        }

        // Init "Breakpoints" chart
        if ($scope.policyName === 'cssBreakpoints' && $scope.rule.value > 0) {

            // Seek for the biggest breakpoint
            var max = 0;
            $scope.rule.offendersObj.forEach(function(offender) {
                if (offender.pixels > max) {
                    max = offender.pixels;
                }
            });
            max = Math.max(max + 100, 1400);

            // We group offenders 10px by 10px
            var GROUP_SIZE = 20;

            // Generate an empty array of values
            $scope.breakpointsLabels = [];
            $scope.breakpointsData = [[]];
            for (var i = 0; i <= max / GROUP_SIZE; i++) {
                $scope.breakpointsLabels[i] = '';
                $scope.breakpointsData[0][i] = 0;
            }

            // Fill it with results
            $scope.rule.offendersObj.forEach(function(offender) {
                var group = Math.floor((offender.pixels + 1) / GROUP_SIZE);

                if ($scope.breakpointsLabels[group] !== '') {
                    $scope.breakpointsLabels[group] += '/';
                }
                $scope.breakpointsLabels[group] += offender.breakpoint;

                $scope.breakpointsData[0][group] += offender.count;
            });

            $scope.breakpointsColours = ['#9c4274'];
            $scope.breakpointsOptions = {
                scaleShowGridLines: false,
                barShowStroke: false,
                showTooltips: false,
                pointDot: false,
                responsive: true,
                maintainAspectRatio: true,
                strokeColor: 'rgba(20, 200, 20, 1)',
                scaleFontSize: 9
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