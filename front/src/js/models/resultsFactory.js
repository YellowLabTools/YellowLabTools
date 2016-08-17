var resultsFactory = angular.module('resultsFactory', ['ngResource']);

resultsFactory.factory('Results', ['$resource', function($resource) {
    return $resource('api/results/:runId', {
        
    });
}]);