var apiService = angular.module('apiService', []);

apiService.factory('API', ['$location', 'Runs', 'Results', function($location, Runs, Results) {

    return {

        launchTest: function(url, settings) {
            var runObject = {
                url: url,
                waitForResponse: false,
                screenshot: true,
                jsTimeline: true,
                device: settings.device,
                waitForSelector: settings.waitForSelector,
                cookie: settings.cookie,
                authUser: settings.authUser,
                authPass: settings.authPass,
            };

            if (settings.waitForSelector && settings.waitForSelector !== '') {
                runObject.waitForSelector = settings.waitForSelector;
            }

            if (settings.cookie && settings.cookie !== '') {
                runObject.cookie = settings.cookie;
            }

            if (settings.authUser && settings.authUser !== '' && settings.authPass && settings.authPass !== '') {
                runObject.authUser = settings.authUser;
                runObject.authPass = settings.authPass;
            }

            Runs.save(runObject, function(data) {
                $location.path('/queue/' + data.runId);
            }, function(response) {
                if (response.status === 429) {
                    alert('Too many requests, you reached the max number of requests allowed in 24h');
                } else {
                    alert('An error occured...');
                }
            });
        },

        relaunchTest: function(result) {
            this.launchTest(result.params.url, result.params.options);
        }
    };

}]);