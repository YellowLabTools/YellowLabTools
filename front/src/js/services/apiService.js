var apiService = angular.module('apiService', []);

apiService.factory('API', ['$location', 'Runs', 'Results', function($location, Runs, Results) {

    return {

        launchTest: function(url, settings) {
            var runObject = {
                url: url,
                waitForResponse: false,
                screenshot: true,
                device: settings.device,
                waitForSelector: settings.waitForSelector,
                cookie: settings.cookie,
                authUser: settings.authUser,
                authPass: settings.authPass,
                blockDomain: settings.blockDomain,
                allowedDomains: settings.allowedDomains,
                noExternals: settings.noExternals
            };

            
            if (settings.domainsBlackOrWhite === 'black') {
                runObject.blockDomain = this.parseDomains(settings.domains);
            } else if (settings.domainsBlackOrWhite === 'white') {
                var allowedDomains = this.parseDomains(settings.domains);
                if (allowedDomains.length > 0) {
                    runObject.allowDomain = allowedDomains;
                } else {
                    runObject.noExternals = true;
                }
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
        },

        parseDomains: function(textareaContent) {
            var lines = textareaContent.split('\n');
            
            function removeEmptyLines (line) {
                return line.trim() !== '';
            }

            // Remove empty lines
            return lines.filter(removeEmptyLines).join(',');
        }
    };

}]);