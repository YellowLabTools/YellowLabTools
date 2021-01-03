var queueCtrl = angular.module('queueCtrl', ['runsFactory']);

queueCtrl.controller('QueueCtrl', ['$scope', '$routeParams', '$location', 'Runs', 'API', function($scope, $routeParams, $location, Runs, API) {
    $scope.runId = $routeParams.runId;

    var numberOfTries = 0;
    
    function getRunStatus () {
        Runs.get({runId: $scope.runId}, function(data) {
            $scope.url = data.params.url;
            $scope.status = data.status;
            $scope.progress = data.progress;
            $scope.notFound = false;
            $scope.connectionLost = false;

            if (data.status.statusCode === 'awaiting') {
                numberOfTries ++;

                // Retrying every 2 seconds (and increasing the delay a bit more each time)
                setTimeout(getRunStatus, 2000 + (numberOfTries * 100));

            } else if (data.status.statusCode === 'running') {
                numberOfTries ++;

                // Retrying every second or so
                setTimeout(getRunStatus, 1000 + (numberOfTries * 10));

            } else if (data.status.statusCode === 'complete') {
                $location.path('/result/' + $scope.runId).replace();
            } else {
                // Handled by the view
            }
        }, function(response) {
            if (response.status === 404) {
                $scope.notFound = true;
                $scope.connectionLost = false;
            } else if (response.status === 0) {
                // Connection lost, retry in 10 seconds
                setTimeout(getRunStatus, 10000);
                $scope.connectionLost = true;
                $scope.notFound = false;
            }
        });
    }
    
    getRunStatus();
}]);

    