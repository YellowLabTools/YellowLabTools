var dashboardCtrl = angular.module('dashboardCtrl', ['resultsFactory', 'menuService']);

dashboardCtrl.controller('DashboardCtrl', ['$scope', '$rootScope', '$routeParams', '$location', 'Results', 'API', 'Menu', function($scope, $rootScope, $routeParams, $location, Results, API, Menu) {
    $scope.runId = $routeParams.runId;
    $scope.Menu = Menu.setCurrentPage('dashboard', $scope.runId);
    $scope.fromSocialShare = $location.search().share;
    
    function loadResults() {
        // Load result if needed
        if (!$rootScope.loadedResult || $rootScope.loadedResult.runId !== $routeParams.runId) {
            Results.get({runId: $routeParams.runId}, function(result) {
                $rootScope.loadedResult = result;
                $scope.result = result;
                init();
            }, function(err) {
                $scope.error = true;
            });
        } else {
            $scope.result = $rootScope.loadedResult;
            init();
        }
    }

    function init() {
        // By default, Angular sorts object's attributes alphabetically. Countering this problem by retrieving the keys order here.
        $scope.categoriesOrder = Object.keys($scope.result.scoreProfiles.generic.categories);
        
        $scope.globalScore = Math.max($scope.result.scoreProfiles.generic.globalScore, 0);
        $scope.tweetText = 'My website\'s score is ' + $scope.globalScore + '/100 on #YellowLabTools!';
    }

    $scope.showRulePage = function(ruleName) {
        $location.path('/result/' + $scope.runId + '/rule/' + ruleName);
    };

    $scope.testAgain = function() {
        API.launchTest($scope.result.params.url);
    };

    /// When comming from a social shared link, the user needs to click on "See full report" button to display the full dashboard.
    $scope.seeFullReport = function() {
        $scope.fromSocialShare = false;
        $location.search({});
    };

    $scope.shareOnTwitter = function(message) {
        openSocialPopup('https://twitter.com/intent/tweet?url=' + document.URL + '%3Fshare&text=' + encodeURIComponent(message));
    };

    $scope.shareOnLinkedin = function(message) {
        openSocialPopup('https://www.linkedin.com/shareArticle?mini=true&url=' + document.URL + '%3Fshare&title=' + encodeURIComponent(message) + '&summary=' + encodeURIComponent('YellowLabTools is a free online tool that analyzes performance and front-end quality of a webpage.'));
    };

    function openSocialPopup(url) {
        var winHeight = 400;
        var winWidth = 600;
        var winTop = (screen.height / 2) - (winHeight / 2);
        var winLeft = (screen.width / 2) - (winWidth / 2);
        window.open(url, 'sharer', 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);
    }

    // Returns the URL of the JSON result
    $scope.getAPIUrl = function() {
        return '/api/results/' + $scope.runId;
    };

    loadResults();
}]);