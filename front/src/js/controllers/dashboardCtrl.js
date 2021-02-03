var dashboardCtrl = angular.module('dashboardCtrl', ['resultsFactory', 'menuService']);

dashboardCtrl.controller('DashboardCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Results', 'API', 'Menu', function($scope, $rootScope, $routeParams, $location, Results, API, Menu) {
    $scope.runId = $routeParams.runId;
    $scope.Menu = Menu.setCurrentPage('dashboard', $scope.runId);
    
    function loadResults() {
        // Load result if needed
        if (!$rootScope.loadedResult || $rootScope.loadedResult.runId !== $routeParams.runId) {
            Results.get({runId: $routeParams.runId, exclude: 'toolsResults'}, function(result) {
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
        // By default, Angular sorts object's attributes alphabetically. Countering this problem by retrieving the keys order here.
        $scope.categoriesOrder = Object.keys($scope.result.scoreProfiles.generic.categories);
        
        $scope.globalScore = Math.max($scope.result.scoreProfiles.generic.globalScore, 0);

        $scope.tweetText = 'I\'ve discovered this cool open-source tool that audits the front-end quality of a web page: ';
    }

    $scope.testAgain = function() {
        API.relaunchTest($scope.result);
    };

    loadResults();
}]);