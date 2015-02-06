var offendersDirectives = angular.module('offendersDirectives', []);

offendersDirectives.directive('domTree', function() {
    return {
        restrict: 'E',
        scope: {
            tree: '='
        },
        template: '<div class="domTree"></div>',
        replace: true,
        link: function(scope, element, attrs) {
            
            function recursiveHtmlBuilder(tree) {
                var html = '';
                var keys = Object.keys(tree);
                
                keys.forEach(function(key) {
                    if (isNaN(tree[key])) {
                        html += '<div><span>' + key + '</span>' + recursiveHtmlBuilder(tree[key]) + '</div>';
                    } else if (tree[key] > 1) {
                        html += '<div><span>' + key + ' <span>(x' + tree[key] + ')</span></span></div>';
                    } else {
                        html += '<div><span>' + key + '</span></div>';
                    }
                });

                return html;
            }

            element.append(recursiveHtmlBuilder(scope.tree));
        }
    };
});

offendersDirectives.directive('domElementButton', function() {
    return {
        restrict: 'E',
        scope: {
            obj: '='
        },
        templateUrl: 'views/domElementButton.html',
        replace: true
    };
});

offendersDirectives.filter('shortenUrl', function() {
    return function(url, maxLength) {
        if (!maxLength) {
            maxLength = 110;
        }

        // Why dividing by 2.1? Because it adds a 5% margin.
        var leftLength = Math.floor((maxLength - 5) / 2.1);
        var rightLength = Math.ceil((maxLength - 5) / 2.1);

        return (url.length > maxLength) ? url.substr(0, leftLength) + ' ... ' + url.substr(-rightLength) : url;
    };
});

offendersDirectives.directive('urlLink', function() {
    return {
        restrict: 'E',
        scope: {
            url: '=',
            maxLength: '='
        },
        template: '<a href="{{url}}" target="_blank" title="{{url}}">{{url | shortenUrl:maxLength}}</a>',
        replace: true
    };
});

offendersDirectives.filter('encodeURIComponent', function() {
    return window.encodeURIComponent;
});

offendersDirectives.directive('fileAndLine', function() {
    return {
        restrict: 'E',
        scope: {
            file: '=',
            line: '=',
            column: '='
        },
        template: '<span><span ng-if="file"><url-link url="file" max-length="60"></url-link></span><span ng-if="!file">&lt;inline CSS&gt;</span> @ {{line}}:{{column}}</span>',
        replace: true
    };
});

offendersDirectives.directive('fileAndLineButton', function() {
    return {
        restrict: 'E',
        scope: {
            file: '=',
            line: '=',
            column: '='
        },
        template: '<div class="offenderButton opens">css file<div class="cssFileAndLine"><file-and-line file="file" line="line" column="column" button="true"></file-and-line></div></div>',
        replace: true
    };
});

offendersDirectives.directive('offenderButton', function() {
    return {
        restrict: 'C',
        link: function(scope, element, attrs) {

            console.log('initializing touchstart');

            element.bind('touchstart mouseenter', function(e) {
                element.addClass('mouseOver');
                e.preventDefault();
            });

            element.bind('touchend mouseleave click', function(e) {
                element.removeClass('mouseOver');
                e.preventDefault();
            });
        }
    };
});