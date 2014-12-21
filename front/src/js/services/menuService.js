var menuService = angular.module('menuService', []);

menuService.factory('Menu', ['$location', function($location) {

    var currentPage, currentRunId;

    return {
        getCurrentPage: function() {
            return currentPage;
        },
        setCurrentPage: function(page, runId) {
            currentPage = page;
            currentRunId = runId;

            return this;
        },
        changePage: function(page) {
            switch (page) {
                case 'index':
                    $location.path('/');
                    break;
                case 'dashboard':
                    $location.path('/result/' + currentRunId);
                    break;
                case 'timeline':
                    $location.path('/result/' + currentRunId + '/timeline');
                    break;
                default:
                    console.err('Undefined Menu.changePage() destination');
            }
        }
    };

}]);