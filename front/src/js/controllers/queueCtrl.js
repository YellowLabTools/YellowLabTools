var queueCtrl = angular.module('queueCtrl', ['runsFactory']);

queueCtrl.controller('QueueCtrl', ['$scope', '$routeParams', '$location', 'Runs', function($scope, $routeParams, $location, Runs) {
    $scope.runId = $routeParams.runId;
    
    function getRunStatus () {
        Runs.get({runId: $scope.runId}, function(data) {
            $scope.status = data.status;
            if (data.status.statusCode === 'running' || data.status.statusCode === 'awaiting') {
                // Retrying in 2 seconds
                setTimeout(getRunStatus, 2000);
            } else if (data.status.statusCode === 'complete') {
                $location.path('/result/' + $scope.runId);
            } else {
                // Handled by the view
            }
        });
    }
    
    getRunStatus();
}]);

    