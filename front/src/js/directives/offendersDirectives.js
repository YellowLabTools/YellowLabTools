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

    function getDomElementButtonHTML(obj) {
        if (obj.tree) {
            return '<div class="offenderButton opens">' + getDomElementButtonInnerHTML(obj) + '</div>';
        }

        return '<div class="offenderButton">' + getDomElementButtonInnerHTML(obj) + '</div>';
    }

    function getDomElementButtonInnerHTML(obj) {
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

        if (obj.tree) {
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


    function getJQueryContextButtonHTML(context) {
        if (context.length === 0) {
            return '<span class="offenderButton">Empty jQuery object</span>';
        }

        if (context.length === 1) {
            return getDomElementButtonHTML(context.elements[0]);
        }

        var html = context.length + ' elements (' + getDomElementButtonHTML(context.elements[0]) + ', ' + getDomElementButtonHTML(context.elements[1]);
        if (context.length === 3) {
            html += ', ' + getDomElementButtonHTML(context.elements[0]);
        } else if (context.length > 3) {
            html += ' and ' + (context.length - 2) + ' more...';
        }
        return html + '}';
    }

    offendersDirectives.directive('timelineParams', function() {
        
        function isJQuery(node) {
            return node.data.type.indexOf('jQuery ') === 0;
        }

        function getNonJQueryHTML(node) {
            var type = node.data.type;

            if (!node.data.callDetails) {
                return '';
            }

            var args = node.data.callDetails.arguments;
            var ctxt = node.data.callDetails.context;


            switch (type) {
                case 'getElementById':
                case 'createElement':
                    return '<b>' + args[0] + '</b>';

                case 'getElementsByClassName':
                case 'getElementsByTagName':
                case 'querySelector':
                case 'querySelectorAll':
                    return '<b>' + args[0] + '</b> on ' + getDomElementButtonHTML(ctxt.elements[0]);

                case 'appendChild':
                    return 'append ' + getDomElementButtonHTML(args[0]) + ' to ' + getDomElementButtonHTML(ctxt.elements[0]);

                case 'insertBefore':
                    return 'insert' + getDomElementButtonHTML(args[0]) + ' into ' + getDomElementButtonHTML(ctxt.elements[0]) + ' before ' + getDomElementButtonHTML(args[1]);

                case 'addEventListener':
                    return 'bind <b>' + args[0] + '</b> to ' + getDomElementButtonHTML(ctxt.elements[0]);

                case 'error':
                    return args[0];

                default:
                    return '';
            }
        }

        function getJQueryHTML(node) {
            var type = node.data.type;
            var args = node.data.callDetails.arguments;
            var ctxt = node.data.callDetails.context;
            
            // escape HTML in args
            for (var i = 0 ; i < 4 ; i ++) {
                if (args[i]) {
                    args[i] = escapeHTML(args[i]);
                }
            }

            if (type === 'jQuery loaded' || type === 'jQuery version change') {
                return args[0];
            }

            switch (type) {
                case 'jQuery - onDOMReady':
                case 'jQuery - windowOnLoad':
                    return '(function)';

                case 'jQuery - Sizzle call':
                    return '<b>' + args[0] + '</b> on ' + getDomElementButtonHTML(ctxt.elements[0]);

                case 'jQuery - find':
                    if (ctxt && ctxt.length === 1 && ctxt.elements[0].type !== 'document') {
                        return '<b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt);
                    } else {
                        return '<b>' + args[0] + '</b>';
                    }
                    break;

                case 'jQuery - html':
                    if (args[0] !== undefined) {
                        return 'set content "<b>' + args[0] + '</b>" to ' + getJQueryContextButtonHTML(ctxt);
                    } else {
                        return 'get content from ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - append':
                    return 'append ' + joinArgs(args) + ' to ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - appendTo':
                    return 'append' + getJQueryContextButtonHTML(ctxt) + ' to <b>' + args[0] + '</b>';

                case 'jQuery - prepend':
                    return 'prepend ' + joinArgs(args) + ' to ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - prependTo':
                    return 'prepend ' + getJQueryContextButtonHTML(ctxt) + ' to <b>' + args[0] + '</b>';

                case 'jQuery - before':
                    return 'insert ' + joinArgs(args) + ' before ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - insertBefore':
                    return 'insert ' + getJQueryContextButtonHTML(ctxt) + ' before <b>' + args[0] + '</b>';

                case 'jQuery - after':
                    return 'insert ' + joinArgs(args) + ' after ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - insertAfter':
                    return 'insert ' + getJQueryContextButtonHTML(ctxt) + ' after <b>' + args[0] + '</b>';

                case 'jQuery - remove':
                case 'jQuery - detach':
                    if (args[0]) {
                        return getJQueryContextButtonHTML(ctxt) + ' filtered by <b>' + args[0] + '</b>';
                    } else {
                        return getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - empty':
                case 'jQuery - clone':
                case 'jQuery - unwrap':
                case 'jQuery - show':
                case 'jQuery - hide':
                case 'jQuery - animate':
                case 'jQuery - fadeIn':
                case 'jQuery - fadeOut':
                case 'jQuery - fadeTo':
                case 'jQuery - fadeToggle':
                case 'jQuery - slideDown':
                case 'jQuery - slideUp':
                case 'jQuery - slideToggle':
                    return getJQueryContextButtonHTML(ctxt);

                case 'jQuery - replaceWith':
                    return 'replace ' + getJQueryContextButtonHTML(ctxt) + ' with <b>' + args[0] + '</b>';

                case 'jQuery - replaceAll':
                    return 'replace <b>' + args[0] + '</b> with ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - text':
                    if (args[0]) {
                        return 'set text "<b>' + args[0] + '</b>" to ' + getJQueryContextButtonHTML(ctxt);
                    } else {
                        return 'get text from ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - wrap':
                case 'jQuery - wrapAll':
                    return 'wrap ' + getJQueryContextButtonHTML(ctxt) + ' within <b>' + args[0] + '</b>';

                case 'jQuery - wrapInner':
                    return 'wrap the content of ' + getJQueryContextButtonHTML(ctxt) + ' within <b>' + args[0] + '</b>';

                case 'jQuery - css':
                case 'jQuery - attr':
                case 'jQuery - prop':
                    if (isStringOfObject(args[0])) {
                        return 'set <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt);
                    } else if (args[1]) {
                        return 'set <b>' + args[0] + '</b> : <b>' + args[1] + '</b> on ' + getJQueryContextButtonHTML(ctxt);
                    } else {
                        return 'get <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - offset':
                case 'jQuery - height':
                case 'jQuery - innerHeight':
                case 'jQuery - outerHeight':
                case 'jQuery - width':
                case 'jQuery - innerWidth':
                case 'jQuery - outerWidth':
                case 'jQuery - scrollLeft':
                case 'jQuery - scrollTop':
                case 'jQuery - position':
                    if (args[0]) {
                        return 'set <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt);
                    } else {
                        return 'get from ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - toggle':
                    if (args[0] === 'true') {
                        return getJQueryContextButtonHTML(ctxt) + ' to visible';
                    } else if (args[0] === 'false') {
                        return getJQueryContextButtonHTML(ctxt) + ' to hidden';
                    } else {
                        return getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - on':
                case 'jQuery - one':
                    if (args[1]) {
                        return 'bind <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt) + '\'s children filtered by <b>' + args[1] + '</b>';
                    } else {
                        return 'bind <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - off':
                    if (args[0]) {
                        if (args[1]) {
                            return 'unbind <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt) + '\'s children filtered by <b>' + args[1] + '</b>';
                        } else {
                            return 'unbind <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt);
                        }
                    } else {
                        return 'unbind all events';
                    }
                    break;

                case 'jQuery - live':
                case 'jQuery - bind':
                    return 'bind <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - die':
                case 'jQuery - unbind':
                    if (args[0]) {
                        return 'unbind <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt);
                    } else {
                        return 'unbind all events';
                    }
                    break;

                case 'jQuery - delegate':
                    return 'bind <b>' + args[1] + '</b> on ' + getJQueryContextButtonHTML(ctxt) + '\'s children filtered by <b>' + args[0] + '</b>';

                case 'jQuery - undelegate':
                    if (args[0]) {
                        if (args[1]) {
                            return 'unbind <b>' + args[1] + '</b> from ' + getJQueryContextButtonHTML(ctxt) + '\'s children filtered by <b>' + args[0] + '</b>';
                        } else {
                            return 'unbind namespace <b>' + args[0] + '</b>';
                        }
                    } else {
                        return 'unbind all events';
                    }
                    break;

                case 'jQuery - blur':
                case 'jQuery - change':
                case 'jQuery - click':
                case 'jQuery - dblclick':
                case 'jQuery - error':
                case 'jQuery - focus':
                case 'jQuery - focusin':
                case 'jQuery - focusout':
                case 'jQuery - hover':
                case 'jQuery - keydown':
                case 'jQuery - keypress':
                case 'jQuery - keyup':
                case 'jQuery - load':
                case 'jQuery - mousedown':
                case 'jQuery - mouseenter':
                case 'jQuery - mouseleave':
                case 'jQuery - mousemove':
                case 'jQuery - mouseout':
                case 'jQuery - mouseover':
                case 'jQuery - mouseup':
                case 'jQuery - resize':
                case 'jQuery - scroll':
                case 'jQuery - select':
                case 'jQuery - submit':
                case 'jQuery - unload':
                    return 'bind on ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - removeAttr':
                case 'jQuery - removeProp':
                    return 'remove <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - val':
                    if (args[0]) {
                        return 'set value <b>' + args[0] + '</b> to ' + getJQueryContextButtonHTML(ctxt);
                    } else {
                        return 'get value from ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - hasClass':
                case 'jQuery - addClass':
                case 'jQuery - removeClass':
                    return '<b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - toggleClass':
                    if (args[0]) {
                        if (args[1]) {
                            return 'toggle <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt) + ' to <b>' + args[1] + '</b>';
                        } else {
                            return 'toggle <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt);
                        }
                    } else {
                        return 'magic no-argument toggleClass';
                    }
                    break;

                case 'jQuery - children':
                    if (args[0]) {
                        return 'of ' + getJQueryContextButtonHTML(ctxt) + ' filtered by <b>' + args[0] + '</b>';
                    } else {
                        return 'of ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - closest':
                    if (args[1]) {
                        return 'closest <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt) + ' in context <b>' + args[1] + '</b>';
                    } else {
                        return 'closest <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - next':
                case 'jQuery - nextAll':
                    if (args[0]) {
                        return 'after ' + getJQueryContextButtonHTML(ctxt) + ' matching <b>' + args[0] + '</b>';
                    } else {
                        return 'after ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - nextUntil':
                    if (args[0]) {
                        if (args[1]) {
                            return 'after ' + getJQueryContextButtonHTML(ctxt) + ' until <b>' + args[0] + '</b> and matching <b>' + args[1] + '</b>';
                        } else {
                            return 'after ' + getJQueryContextButtonHTML(ctxt) + ' until <b>' + args[0] + '</b>';
                        }
                    } else {
                        return 'after ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - offsetParent':
                    return 'of ' + getJQueryContextButtonHTML(ctxt);

                case 'jQuery - prev':
                case 'jQuery - prevAll':
                    if (args[0]) {
                        return 'before ' + getJQueryContextButtonHTML(ctxt) + ' matching <b>' + args[0] + '</b>';
                    } else {
                        return 'before ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - prevUntil':
                    if (args[0]) {
                        if (args[1]) {
                            return 'before ' + getJQueryContextButtonHTML(ctxt) + ' until <b>' + args[0] + '</b> and matching <b>' + args[1] + '</b>';
                        } else {
                            return 'before ' + getJQueryContextButtonHTML(ctxt) + ' until <b>' + args[0] + '</b>';
                        }
                    } else {
                        return 'before ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - parent':
                case 'jQuery - parents':
                    if (args[0]) {
                        return 'of ' + getJQueryContextButtonHTML(ctxt) + ' matching <b>' + args[0] + '</b>';
                    } else {
                        return 'of ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - parentsUntil':
                    if (args[0]) {
                        if (args[1]) {
                            return 'of ' + getJQueryContextButtonHTML(ctxt) + ' until <b>' + args[0] + '</b> and matching <b>' + args[1] + '</b>';
                        } else {
                            return 'of ' + getJQueryContextButtonHTML(ctxt) + ' until <b>' + args[0] + '</b>';
                        }
                    } else {
                        return 'of ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - siblings':
                    if (args[0]) {
                        return 'near ' + getJQueryContextButtonHTML(ctxt) + ' matching <b>' + args[0] + '</b>';
                    } else {
                        return 'near ' + getJQueryContextButtonHTML(ctxt);
                    }
                    break;

                case 'jQuery - onDOMReady':
                    return '(function)';

                default:
                    return '';
            }
        }

        function escapeHTML(html) {
            var entityMap = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': '&quot;',
                "'": '&#39;',
                "/": '&#x2F;'
            };

            return String(html).replace(/[&<>"'\/]/g, function (s) {
                return entityMap[s];
            });
        }

        function joinArgs(args) {
            var html = '<b>' + args[0] + '</b>';
            if (args[1]) {
                html += ', <b>' + args[1] + '</b>';
                if (args[2]) {
                    html += ', <b>' + args[2] + '</b>';
                    if (args[3]) {
                        html += ', and more...';
                    }
                }
            }
            return html;
        }

        function getHTML(node) {
            if (isJQuery(node)) {
                return getJQueryHTML(node);
            } else {
                return getNonJQueryHTML(node);
            }
        }

       function isStringOfObject(str) {
            return typeof str === 'string' && str[0] === '{' && str[str.length - 1] === '}';
        }

        function isPureString(str) {
            return typeof str === 'string' && str[0] !== '{' && str !== '(function)' && str !== '[Object]' && str !== '[Array]' && str !== 'true' && str !== 'false' && str !== 'undefined' && str !== 'unknown';
        }

        return {
            restrict: 'E',
            scope: {
                node: '='
            },
            template: '<div class="value offenders"></div>',
            replace: true,
            link: function(scope, element) {
                var html = getHTML(scope.node);
                if (html) {
                    element.append(html);
                }
            }
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

})();