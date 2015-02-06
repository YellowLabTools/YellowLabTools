var indexCtrl = angular.module('indexCtrl', []);

indexCtrl.controller('IndexCtrl', ['$scope', '$location', 'API', function($scope, $location, API) {
    $scope.launchTest = function() {
        if ($scope.url) {
            API.launchTest($scope.url);
        }
    };
}]);