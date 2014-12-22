var dashboardCtrl = angular.module('dashboardCtrl', ['resultsFactory', 'menuService']);

dashboardCtrl.controller('DashboardCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Results', 'Menu', function($scope, $rootScope, $routeParams, $location, Results, Menu) {
    $scope.runId = $routeParams.runId;
    $scope.Menu = Menu.setCurrentPage('dashboard', $scope.runId);
    
    function loadResults() {
        // Load result if needed
        if (!$rootScope.loadedResult || $rootScope.loadedResult.runId !== $routeParams.runId) {
            Results.get({runId: $routeParams.runId}, function(result) {
                $rootScope.loadedResult = result;
                $scope.result = result;
            });
        } else {
            $scope.result = $rootScope.loadedResult;
        }
    }

    $scope.showRulePage = function(ruleName) {
        $location.path('/result/' + $scope.runId + '/rule/' + ruleName);
    };

    loadResults();
}]);