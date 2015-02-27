var yltApp = angular.module('YellowLabTools', [
    'ngRoute',
    'ngSanitize',
    'ngAnimate',
    'indexCtrl',
    'dashboardCtrl',
    'queueCtrl',
    'ruleCtrl',
    'screenshotCtrl',
    'timelineCtrl',
    'runsFactory',
    'resultsFactory',
    'apiService',
    'menuService',
    'gradeDirective',
    'jsChildrenDirective',
    'offendersDirectives'
]);

yltApp.run(['$rootScope', '$location', function($rootScope, $location) {
    $rootScope.loadedRunId = null;

    // Google Analytics
    $rootScope.$on('$routeChangeSuccess', function(){
        ga('send', 'pageview', {'page': $location.path()});
    });
}]);

yltApp.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'views/index.html',
                controller: 'IndexCtrl'
            }).
            when('/queue/:runId', {
                templateUrl: 'views/queue.html',
                controller: 'QueueCtrl'
            }).
            when('/about', {
                templateUrl: 'views/about.html'
            }).
            when('/result/:runId', {
                templateUrl: 'views/dashboard.html',
                controller: 'DashboardCtrl'
            }).
            when('/result/:runId/timeline', {
                templateUrl: 'views/timeline.html',
                controller: 'TimelineCtrl'
            }).
            when('/result/:runId/screenshot', {
                templateUrl: 'views/screenshot.html',
                controller: 'ScreenshotCtrl'
            }).
            when('/result/:runId/rule/:policy', {
                templateUrl: 'views/rule.html',
                controller: 'RuleCtrl'
            }).
            otherwise({
                redirectTo: '/'
            });
            
            $locationProvider.html5Mode(true);
    }
]);

