var app = angular.module("ShowOffendersDirective", []);

app.directive('showOffenders', function() {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            modalTitle: "@",
            metricName: "@",
            phantomasResults: "="
        },
        controller: function($scope, $element, $attrs, $location) {
            $scope.dialogShown = false;
        },
        template: '&nbsp;<span ng-click="dialogShown = true" class="icon-eye" title="See offenders"></span><modal-dialog show="dialogShown" dialog-title="{{modalTitle}}: {{phantomasResults.metrics[metricName]}}" width="70%"><ul><li ng-repeat="offender in phantomasResults.offenders[metricName] track by $index">{{offender}}</li></ul></modal-dialog>'
    };
});