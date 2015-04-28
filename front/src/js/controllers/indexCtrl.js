var indexCtrl = angular.module('indexCtrl', []);

indexCtrl.controller('IndexCtrl', ['$scope', 'Settings', 'API', function($scope, Settings, API) {
    
    $scope.settings = Settings.getMergedSettings();

    $scope.launchTest = function() {
        if ($scope.url) {
            Settings.saveSettings($scope.settings);
            API.launchTest($scope.url, $scope.settings);
        }
    };
}]);