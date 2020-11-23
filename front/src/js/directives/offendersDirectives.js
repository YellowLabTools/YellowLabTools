(function() {
    "use strict";
    var offendersDirectives = angular.module('offendersDirectives', []);

    function getdomTreeHTML(tree) {
        return '<div class="domTree">' + getdomTreeInnerHTML(tree) + '</div>';
    }

    function getdomTreeInnerHTML(tree) {
        return recursiveHtmlBuilder(tree);
    }

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

    offendersDirectives.directive('domTree', function() {
        return {
            restrict: 'E',
            scope: {
                tree: '='
            },
            template: '<div class="domTree"></div>',
            replace: true,
            link: function(scope, element) {
                element.append(getdomTreeInnerHTML(scope.tree));
            }
        };
    });

    function getDomElementButtonHTML(obj, onASingleLine) {
        if (obj.tree && !onASingleLine) {
            return '<div class="offenderButton opens">' + getDomElementButtonInnerHTML(obj, onASingleLine) + '</div>';
        } else {
            return '<div class="offenderButton">' + getDomElementButtonInnerHTML(obj, onASingleLine) + '</div>';
        }
    }

    function getDomElementButtonInnerHTML(obj, onASingleLine) {
        if (obj.type === 'html' ||
            obj.type === 'body' ||
            obj.type === 'head' ||
            obj.type === 'window' ||
            obj.type === 'document' ||
            obj.type === 'fragment') {
                return obj.type;
        }

        if (obj.type === 'notAnElement') {
            return 'Incorrect element';
        }

        var html = '';
        if (obj.type === 'domElement') {
            html = 'DOM element <b>' + obj.element + '</b>';
        } else if (obj.type === 'fragmentElement') {
            html = 'Fragment element <b>' + obj.element + '</b>';
        } else if (obj.type === 'createdElement') {
            html = 'Created element <b>' + obj.element + '</b>';
        }

        if (obj.tree && !onASingleLine) {
            html += getdomTreeHTML(obj.tree);
        }

        return html;
    }

    offendersDirectives.directive('domElementButton', function() {
        return {
            restrict: 'E',
            scope: {
                obj: '='
            },
            template: '<div class="offenderButton" ng-class="{opens: obj.tree}"></div>',
            replace: true,
            link: function(scope, element) {                
                element.append(getDomElementButtonInnerHTML(scope.obj));
            }
        };
    });

    offendersDirectives.filter('lastDOMNode', function() {
        return function(str) {
            var splited = str.split(' > ');
            return splited[splited.length - 1];
        };
    });

    function getBacktraceHTML(backtrace) {
        var html = '';
        var parsedBacktrace = parseBacktrace(backtrace);

        if (!parsedBacktrace || parsedBacktrace.length === 0) {
            html += '<div><div>can\'t find any backtrace :/</div></div>';
        } else {
            for (var i = 0 ; i < parsedBacktrace.length ; i++) {
                html += '<div>';
                html += '<div>' + (parsedBacktrace[i].fnName || '(anonymous function)') + '</div>';
                html += '<div class="trace">' + getUrlLink(parsedBacktrace[i].filePath, 40) + '</div>';
                if (parsedBacktrace[i].column) {
                    html += '<div>' + parsedBacktrace[i].line + ':' + parsedBacktrace[i].column + '</div>';    
                } else {
                    html += '<div>line ' + parsedBacktrace[i].line + '</div>';
                }
                html += '</div>';
            }
        }

        return html;
    }

    function parseBacktrace(str) {
        if (!str) {
            return null;
        }

        var out = [];
        var splited = str.split(' / ');
        
        try {

            splited.forEach(function(trace) {
                var fnName = null, fileAndLine;

                var withFnResult = /^([^\s\(]+) \((.+:\d+)\)$/.exec(trace);
                
                if (withFnResult === null) {
                    // Try the PhantomJS 2 format
                    withFnResult = /^([^\s\(]+) \((.+:\d+:\d+)\)$/.exec(trace);
                }

                if (withFnResult === null) {
                    // Yet another PhantomJS 2 format?
                    withFnResult = /^([^\s\(]+|global code)@(.+:\d+:\d+)$/.exec(trace);
                }

                if (withFnResult === null) {
                    // Try the PhantomJS 2 ERROR format
                    withFnResult = /^([^\s\(]+) (http.+:\d+)$/.exec(trace);
                }

                if (withFnResult === null) {
                    fileAndLine = trace;
                } else {
                    fnName = withFnResult[1];
                    fileAndLine = withFnResult[2];
                }

                // And now the second part
                var fileAndLineSplit = /^(.*):(\d+):(\d+)$/.exec(fileAndLine);

                if (fileAndLineSplit === null) {
                    fileAndLineSplit = /^(.*):(\d+)$/.exec(fileAndLine);
                }

                var filePath = fileAndLineSplit[1];
                var line = fileAndLineSplit[2];
                var column = fileAndLineSplit[3];

                // Filter phantomas code
                if (filePath.indexOf('phantomjs://') === -1) {
                    out.push({
                        fnName: fnName,
                        filePath: filePath,
                        line: line,
                        column: column
                    });
                }
            });

        } catch(e) {
            return null;
        }

        return out;
    }

    function shortenUrl(url, maxLength) {
        if (!maxLength) {
            maxLength = 110;
        }

        // Why dividing by 2.1? Because it adds a 5% margin.
        var leftLength = Math.floor((maxLength - 5) / 2.1);
        var rightLength = Math.ceil((maxLength - 5) / 2.1);

        return (url.length > maxLength) ? url.substr(0, leftLength) + ' ... ' + url.substr(-rightLength) : url;
    }

    offendersDirectives.filter('shortenUrl', function() {
        return shortenUrl;
    });

    function getUrlLink(url, maxLength) {
        return '<a href="' + url + '" target="_blank" title="' + url + '">' + shortenUrl(url, maxLength) + '</a>';
    }

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
            template: '<span><span ng-if="file"><url-link url="file" max-length="60"></url-link></span><span ng-if="!file">&lt;inline CSS&gt;</span><span ng-if="line !== null && column !== null"> @ {{line}}:{{column}}</span></span>',
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

    offendersDirectives.filter('bytes', function() {
        return function(bytes) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
                return '-';
            }
            
            var kilo = bytes / 1024;

            if (kilo < 1) {
                return bytes + ' bytes';
            }

            if (kilo < 100) {
                return kilo.toFixed(1) + ' KB';
            }

            if (kilo < 1024) {
                return kilo.toFixed(0) + ' KB';
            }

            var mega = kilo / 1024;

            if (mega < 10) {
                return mega.toFixed(2) + ' MB';
            }

            return mega.toFixed(1) + ' MB';
        };
    });

    offendersDirectives.filter('addSpaces', function() {
        return function(str) {
            return str.split('').join(' ');
        };
    });

    // Proxify an HTTP image to HTTPS if hosted on HTTPS
    // Uses a great free open-source external service: https://images.weserv.nl
    offendersDirectives.filter('https', function() {
        return function(url) {
            if (url && url.indexOf('http://') === 0 && window.location.protocol === 'https:') {
                return 'https://images.weserv.nl/?url=' + encodeURIComponent(url.substr(7));
            }
            return url;
        };
    });

    offendersDirectives.filter('roundNbr', function() {
        return function(nbr) {
            return Math.round(nbr);
        };
    });

})();
