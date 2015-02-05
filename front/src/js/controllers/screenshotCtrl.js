var screenshotCtrl = angular.module('screenshotCtrl', ['resultsFactory', 'menuService']);

screenshotCtrl.controller('ScreenshotCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Results', 'Runs', 'Menu', function($scope, $rootScope, $routeParams, $location, Results, Runs, Menu) {
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
            init();
        }
    }

    function init() {
        
    }

    $scope.testAgain = function() {
        Runs.save({
                url: $scope.result.params.url,
                waitForResponse: false,
                screenshot: true
            }, function(data) {
                $location.path('/queue/' + data.runId);
            });
    };

    loadResults();
}]);