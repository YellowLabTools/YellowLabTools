var dashboardCtrl = angular.module('dashboardCtrl', ['resultsFactory']);

dashboardCtrl.controller('DashboardCtrl', ['$scope', '$routeParams', 'Results', function($scope, $routeParams, Results) {
    $scope.dashboard = "this is a dashboard";
    $scope.runId = $routeParams.runId;
    Results.get({runId: $routeParams.runId}, function(result) {
        $scope.result = result;
        console.log(result);
    });
}]);