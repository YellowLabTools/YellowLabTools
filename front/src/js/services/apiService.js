var apiService = angular.module('apiService', []);

apiService.factory('API', ['$location', 'Runs', 'Results', function($location, Runs, Results) {

    return {

        launchTest: function(url) {
            Runs.save({
                url: url,
                waitForResponse: false,
                screenshot: true
            }, function(data) {
                $location.path('/queue/' + data.runId);
            }, function(response) {
                if (response.status === 429) {
                    alert('Too many requests, you reached the max number of requests allowed in 24h');
                } else {
                    alert('An error occured...');
                }
            });
        }


    };

}]);