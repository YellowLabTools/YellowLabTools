var dashboardCtrl = angular.module('dashboardCtrl', ['resultsFactory', 'menuService']);

dashboardCtrl.controller('DashboardCtrl', ['$scope', '$routeParams', 'Results', 'Menu', function($scope, $routeParams, Results, Menu) {
    $scope.runId = $routeParams.runId;
    $scope.Menu = Menu.setCurrentPage('dashboard', $scope.runId);
    
    Results.get({runId: $routeParams.runId}, function(result) {
        $scope.result = result;
        console.log(result);
    });
}]);