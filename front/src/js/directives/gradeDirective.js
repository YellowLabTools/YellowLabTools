var gradeDirective = angular.module('gradeDirective', []);

gradeDirective.directive('grade', function() {
 
    return {
        restrict: 'E',
        scope: {
            score: '=score'
        },
        template: '<div ng-class="getGrade(score)">{{getGrade(score)}}</div>',
        replace: true,
        controller : ['$scope', function($scope) {
            $scope.getGrade = function(score) {
                if (score > 80) {
                    return 'A';
                }
                if (score > 60) {
                    return 'B';
                }
                if (score > 40) {
                    return 'C';
                }
                if (score > 20) {
                    return 'D';
                }
                if (score > 0) {
                    return 'E';
                }
                return 'F';
            };
        }]
    };
});