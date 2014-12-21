var dashboardCtrl = angular.module('dashboardCtrl', ['resultsFactory', 'menuService']);

dashboardCtrl.controller('DashboardCtrl', ['$scope', '$routeParams', '$location', 'Results', 'Menu', function($scope, $routeParams, $location, Results, Menu) {
    $scope.runId = $routeParams.runId;
    $scope.Menu = Menu.setCurrentPage('dashboard', $scope.runId);
    
    Results.get({runId: $routeParams.runId}, function(result) {
        $scope.result = result;
        console.log(result);
    });

    $scope.showRulePage = function(ruleName) {
        $location.path('/result/' + $scope.runId + '/rule/' + ruleName);
    };
}]);