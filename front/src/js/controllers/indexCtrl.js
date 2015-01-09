var indexCtrl = angular.module('indexCtrl', []);

indexCtrl.controller('IndexCtrl', ['$scope', '$location', 'Runs', function($scope, $location, Runs) {
    $scope.launchTest = function() {
        if ($scope.url) {
            Runs.save({
                url: $scope.url,
                waitForResponse: false
            }, function(data) {
                $location.path('/queue/' + data.runId);
            });
            
        }
    };
}]);