var indexCtrl = angular.module('indexCtrl', []);

indexCtrl.controller('IndexCtrl', ['$scope', '$routeParams', '$location', 'Settings', 'API', function($scope, $routeParams, $location, Settings, API) {
    
    $scope.settings = Settings.getMergedSettings();

    $scope.launchTest = function() {
        if ($scope.url) {
            $location.search('url', null);
            $location.search('run', null);
            Settings.saveSettings($scope.settings);
            API.launchTest($scope.url, $scope.settings);
        }
    };

    // Auto fill URL field and auto launch test when the good params are set in the URL
    if ($routeParams.url) {
        $scope.url = $routeParams.url;
        if ($routeParams.run === 'true' || $routeParams.run === 1 || $routeParams.run === '1') {
            $scope.launchTest();
        }
    }
}]);