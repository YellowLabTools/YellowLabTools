var gradeDirective = angular.module('gradeDirective', []);

gradeDirective.directive('grade', function() {
 
    return {
        restrict: 'E',
        scope: {
            score: '=score'
        },
        template: '<div ng-class="getGrade(score)">{{getGrade(score)}}</div>',
        replace: true,
        controller : function($scope) {
            $scope.getGrade = function(score) {
                if (score >= 85) {
                    return 'A';
                }
                if (score >= 65) {
                    return 'B';
                }
                if (score >= 45) {
                    return 'C';
                }
                if (score >= 30) {
                    return 'D';
                }
                if (score >= 15) {
                    return 'E';
                }
                return 'F';
            };
        }
    };
});