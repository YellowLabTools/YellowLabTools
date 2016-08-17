var runsFactory = angular.module('runsFactory', ['ngResource']);

runsFactory.factory('Runs', ['$resource', function($resource) {
    return $resource('api/runs/:runId', {
    
    });
}]);