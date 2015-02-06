var screenshotCtrl = angular.module('screenshotCtrl', ['resultsFactory', 'menuService']);

screenshotCtrl.controller('ScreenshotCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Results', 'API', 'Menu', function($scope, $rootScope, $routeParams, $location, Results, API, Menu) {
    $scope.runId = $routeParams.runId;
    $scope.Menu = Menu.setCurrentPage(null, $scope.runId);
    
    function loadResults() {
        // Load result if needed
        if (!$rootScope.loadedResult || $rootScope.loadedResult.runId !== $routeParams.runId) {
            Results.get({runId: $routeParams.runId}, function(result) {
                $rootScope.loadedResult = result;
                $scope.result = result;
                init();
            }, function(err) {
                $scope.error = true;
            });
        } else {
            $scope.result = $rootScope.loadedResult;
        }
    }

    $scope.backToDashboard = function() {
        $location.path('/result/' + $scope.runId);
    };

    $scope.testAgain = function() {
        API.launchTest($scope.result.params.url);
    };

    loadResults();
}]);