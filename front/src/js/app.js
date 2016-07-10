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
    'settingsService',
    'gradeDirective',
    'offendersDirectives',
    'LocalStorageModule'
]);

yltApp.run(['$rootScope', '$location', function($rootScope, $location) {
    $rootScope.isTouchDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
    $rootScope.loadedRunId = null;

    var oldHash;

    // We don't want the hash to be kept between two pages
    $rootScope.$on('$locationChangeStart', function(param1, param2, param3, param4){
        var newHash = $location.hash();
        if (newHash === oldHash) {
            $location.hash(null);
        }
        oldHash = newHash;
    });

    // Google Analytics
    $rootScope.$on('$routeChangeSuccess', function(){
        ga('send', 'pageview', {'page': $location.path()});
    });

    // GitHub star button (asynchronously loaded iframe)
    window.addEventListener('load', function() {
        window.document.getElementById('ghbtn').src = 'http://ghbtns.com/github-btn.html?user=gmetais&repo=YellowLabTools&type=star&count=true&size=large';
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

// Disable debugging https://docs.angularjs.org/guide/production
yltApp.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
}]);