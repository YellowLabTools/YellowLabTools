var ruleCtrl = angular.module('ruleCtrl', []);

ruleCtrl.controller('RuleCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$sce', 'Menu', 'Results', 'Runs', function($scope, $rootScope, $routeParams, $location, $sce, Menu, Results, Runs) {
    $scope.runId = $routeParams.runId;
    $scope.policyName = $routeParams.policy;
    $scope.Menu = Menu.setCurrentPage(null, $scope.runId);
    $scope.rule = null;

    function loadResults() {
        // Load result if needed
        if (!$rootScope.loadedResult || $rootScope.loadedResult.runId !== $routeParams.runId) {
            Results.get({runId: $routeParams.runId}, function(result) {
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
        $scope.message = $sce.trustAsHtml($scope.rule.policy.message);
    }

    $scope.backToDashboard = function() {
        $location.path('/result/' + $scope.runId);
    };

    $scope.testAgain = function() {
        Runs.save({
                url: $scope.result.params.url,
                waitForResponse: false
            }, function(data) {
                $location.path('/queue/' + data.runId);
            });
    };

    loadResults();
}]);