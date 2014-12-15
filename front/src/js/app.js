var yltApp = angular.module('YellowLabTools', [
    'ngRoute',
    'indexCtrl',
    'aboutCtrl',
    'dashboardCtrl'
]);

yltApp.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'front/views/index.html',
                controller: 'IndexCtrl'
            }).
            when('/about', {
                templateUrl: 'front/views/about.html',
                controller: 'AboutCtrl'
            }).
            when('/results/:runId', {
                templateUrl: 'front/views/dashboard.html',
                controller: 'DashboardCtrl'
            }).
            otherwise({
                redirectTo: '/'
            });
            
            $locationProvider.html5Mode(true);
    }
]);

