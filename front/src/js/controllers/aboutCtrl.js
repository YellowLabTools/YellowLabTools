var aboutCtrl = angular.module('aboutCtrl', []);

aboutCtrl.controller('AboutCtrl', ['$scope', function($scope) {
    $scope.about = "this is about YLT";
}]);