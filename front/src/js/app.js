var yltApp = angular.module('YellowLabTools', [
    'ngRoute',
    'indexCtrl',
    'aboutCtrl',
    'dashboardCtrl',
    'queueCtrl',
    'runsFactory',
    'resultsFactory',
    'menuService',
    'gradeDirective',
]);

yltApp.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'front/views/index.html',
                controller: 'IndexCtrl'
            }).
            when('/queue/:runId', {
                templateUrl: 'front/views/queue.html',
                controller: 'QueueCtrl'
            }).
            when('/about', {
                templateUrl: 'front/views/about.html',
                controller: 'AboutCtrl'
            }).
            when('/result/:runId', {
                templateUrl: 'front/views/dashboard.html',
                controller: 'DashboardCtrl'
            }).
            otherwise({
                redirectTo: '/'
            });
            
            $locationProvider.html5Mode(true);
    }
]);

