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


    function getJQueryContextButtonHTML(context, onASingleLine) {
        if (context.length === 0) {
            return '<span class="offenderButton">Empty jQuery object</span>';
        }

        if (context.length === 1) {
            return getDomElementButtonHTML(context.elements[0], onASingleLine);
        }

        var html = context.length + ' elements (' + getDomElementButtonHTML(context.elements[0], onASingleLine) + ', ' + getDomElementButtonHTML(context.elements[1], onASingleLine);
        if (context.length === 3) {
            html += ', ' + getDomElementButtonHTML(context.elements[0], onASingleLine);
        } else if (context.length > 3) {
            html += ' and ' + (context.length - 2) + ' more...';
        }
        return html + ')';
    }

    function isJQuery(node) {
        return node.data.type.indexOf('jQuery ') === 0;
    }

    function getNonJQueryHTML(node, onASingleLine) {
        var type = node.data.type;

        if (node.windowPerformance) {
            switch (type) {
                case 'documentScroll':
                    return '(triggering the scroll event on <b>document</b>)';

                case 'windowScroll':
                    return '(triggering the scroll event on <b>window</b>)';

                case 'window.onscroll':
                    return '(calling the <b>window.onscroll</b> function)';

                default:
                    return '';
            }
        }

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
                return '<b>' + args[0] + '</b> on ' + getDomElementButtonHTML(ctxt.elements[0], onASingleLine);

            case 'appendChild':
                return 'append ' + getDomElementButtonHTML(args[0], onASingleLine) + ' to ' + getDomElementButtonHTML(ctxt.elements[0], onASingleLine);

            case 'insertBefore':
                return 'insert ' + getDomElementButtonHTML(args[0], onASingleLine) + ' into ' + getDomElementButtonHTML(ctxt.elements[0], onASingleLine) + ' before ' + getDomElementButtonHTML(args[1], onASingleLine);

            case 'addEventListener':
                return 'bind <b>' + args[0] + '</b> to ' + getDomElementButtonHTML(ctxt.elements[0], onASingleLine);

            case 'getComputedStyle':
                return getDomElementButtonHTML(args[0], onASingleLine) + (args[1] || '');

            case 'error':
                return args[0];

            case 'jQuery - onDOMReady':
                return '(function)';

            case 'documentScroll':
                return 'The scroll event just triggered on document';

            case 'windowScroll':
                return 'The scroll event just triggered on window';

            case 'window.onscroll':
                return 'The window.onscroll function just got called';

            default:
                return '';
        }
    }

    function getJQueryHTML(node, onASingleLine) {
        var type = node.data.type;
        var unescapedArgs = node.data.callDetails.arguments;
        var args = [];
        var ctxt = node.data.callDetails.context;
        
        // escape HTML in args
        for (var i = 0 ; i < 4 ; i ++) {
            if (unescapedArgs[i] !== undefined) {
                args[i] = escapeHTML(unescapedArgs[i]);
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
                return '<b>' + args[0] + '</b> on ' + getDomElementButtonHTML(ctxt.elements[0], onASingleLine);

            case 'jQuery - find':
                if (ctxt && ctxt.length === 1 && ctxt.elements[0].type !== 'document') {
                    return '<b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else {
                    return '<b>' + args[0] + '</b>';
                }
                break;

            case 'jQuery - html':
                if (args[0] !== undefined) {
                    return 'set content "<b>' + args[0] + '</b>" to ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else {
                    return 'get content from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - append':
                return 'append ' + joinArgs(args) + ' to ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - appendTo':
                return 'append ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' to <b>' + args[0] + '</b>';

            case 'jQuery - prepend':
                return 'prepend ' + joinArgs(args) + ' to ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - prependTo':
                return 'prepend ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' to <b>' + args[0] + '</b>';

            case 'jQuery - before':
                return 'insert ' + joinArgs(args) + ' before ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - insertBefore':
                return 'insert ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' before <b>' + args[0] + '</b>';

            case 'jQuery - after':
                return 'insert ' + joinArgs(args) + ' after ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - insertAfter':
                return 'insert ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' after <b>' + args[0] + '</b>';

            case 'jQuery - remove':
            case 'jQuery - detach':
                if (args[0]) {
                    return getJQueryContextButtonHTML(ctxt, onASingleLine) + ' filtered by <b>' + args[0] + '</b>';
                } else {
                    return getJQueryContextButtonHTML(ctxt, onASingleLine);
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
                return getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - replaceWith':
                return 'replace ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' with <b>' + args[0] + '</b>';

            case 'jQuery - replaceAll':
                return 'replace <b>' + args[0] + '</b> with ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - text':
                if (args[0] !== undefined) {
                    return 'set text "<b>' + args[0] + '</b>" to ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else {
                    return 'get text from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - wrap':
            case 'jQuery - wrapAll':
                return 'wrap ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' within <b>' + args[0] + '</b>';

            case 'jQuery - wrapInner':
                return 'wrap the content of ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' within <b>' + args[0] + '</b>';

            case 'jQuery - css':
            case 'jQuery - attr':
            case 'jQuery - prop':
                if (isStringOfObject(args[0])) {
                    return 'set <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else if (args[1]) {
                    return 'set <b>' + args[0] + '</b> : <b>' + args[1] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else {
                    return 'get <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - offset':
            case 'jQuery - height':
            case 'jQuery - innerHeight':
            case 'jQuery - width':
            case 'jQuery - innerWidth':
            case 'jQuery - scrollLeft':
            case 'jQuery - scrollTop':
            case 'jQuery - position':
                if (args[0]) {
                    return 'set <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else {
                    return 'get from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - outerHeight':
            case 'jQuery - outerWidth':
                if (args[0] && args[0] !== 'true') {
                    return 'set <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else if (args[0] === 'true') {
                    return 'get from ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' (with include margins option)';
                } else {
                    return 'get from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - toggle':
                if (args[0] === 'true') {
                    return getJQueryContextButtonHTML(ctxt, onASingleLine) + ' to visible';
                } else if (args[0] === 'false') {
                    return getJQueryContextButtonHTML(ctxt, onASingleLine) + ' to hidden';
                } else {
                    return getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - on':
            case 'jQuery - one':
                if (isStringOfObject(args[0])) {
                    return '<b>' + args[0].replace(/&quot;\(function\)&quot;/g, '(function)') + '</b>';
                } else if (args[1] && isPureString(args[1])) {
                    return 'bind <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + '\'s children filtered by <b>' + args[1] + '</b>';
                } else {
                    return 'bind <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - off':
                if (args[0]) {
                    if (args[1]) {
                        return 'unbind <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + '\'s children filtered by <b>' + args[1] + '</b>';
                    } else {
                        return 'unbind <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                    }
                } else {
                    return 'unbind all events';
                }
                break;

            case 'jQuery - live':
            case 'jQuery - bind':
                return 'bind <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - die':
            case 'jQuery - unbind':
                if (args[0]) {
                    return 'unbind <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else {
                    return 'unbind all events';
                }
                break;

            case 'jQuery - delegate':
                return 'bind <b>' + args[1] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + '\'s children filtered by <b>' + args[0] + '</b>';

            case 'jQuery - undelegate':
                if (args[0]) {
                    if (args[1]) {
                        return 'unbind <b>' + args[1] + '</b> from ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + '\'s children filtered by <b>' + args[0] + '</b>';
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
            case 'jQuery - focus':
            case 'jQuery - keydown':
            case 'jQuery - keypress':
            case 'jQuery - keyup':
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
                if (args[0]) {
                    return 'bind on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else {
                    return 'triggered on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - error':
            case 'jQuery - focusin':
            case 'jQuery - focusout':
            case 'jQuery - hover':
            case 'jQuery - load':
            case 'jQuery - unload':
                return 'bind on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - removeAttr':
            case 'jQuery - removeProp':
                return 'remove <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - val':
                if (args[0]) {
                    return 'set value <b>' + args[0] + '</b> to ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                } else {
                    return 'get value from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - hasClass':
            case 'jQuery - addClass':
            case 'jQuery - removeClass':
                return '<b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - toggleClass':
                if (args[0]) {
                    if (args[1]) {
                        return 'toggle <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' to <b>' + args[1] + '</b>';
                    } else {
                        return 'toggle <b>' + args[0] + '</b> on ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                    }
                } else {
                    return 'magic no-argument toggleClass';
                }
                break;

            case 'jQuery - children':
                if (args[0]) {
                    return 'of ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' filtered by <b>' + args[0] + '</b>';
                } else {
                    return 'of ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - closest':
                if (args[1]) {
                    return 'closest <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' in context <b>' + args[1] + '</b>';
                } else {
                    return 'closest <b>' + args[0] + '</b> from ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - next':
            case 'jQuery - nextAll':
                if (args[0]) {
                    return 'after ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' matching <b>' + args[0] + '</b>';
                } else {
                    return 'after ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - nextUntil':
                if (args[0]) {
                    if (args[1]) {
                        return 'after ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' until <b>' + args[0] + '</b> and matching <b>' + args[1] + '</b>';
                    } else {
                        return 'after ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' until <b>' + args[0] + '</b>';
                    }
                } else {
                    return 'after ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - offsetParent':
                return 'of ' + getJQueryContextButtonHTML(ctxt, onASingleLine);

            case 'jQuery - prev':
            case 'jQuery - prevAll':
                if (args[0]) {
                    return 'before ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' matching <b>' + args[0] + '</b>';
                } else {
                    return 'before ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - prevUntil':
                if (args[0]) {
                    if (args[1]) {
                        return 'before ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' until <b>' + args[0] + '</b> and matching <b>' + args[1] + '</b>';
                    } else {
                        return 'before ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' until <b>' + args[0] + '</b>';
                    }
                } else {
                    return 'before ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - parent':
            case 'jQuery - parents':
                if (args[0]) {
                    return 'of ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' matching <b>' + args[0] + '</b>';
                } else {
                    return 'of ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - parentsUntil':
                if (args[0]) {
                    if (args[1]) {
                        return 'of ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' until <b>' + args[0] + '</b> and matching <b>' + args[1] + '</b>';
                    } else {
                        return 'of ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' until <b>' + args[0] + '</b>';
                    }
                } else {
                    return 'of ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

            case 'jQuery - siblings':
                if (args[0]) {
                    return 'near ' + getJQueryContextButtonHTML(ctxt, onASingleLine) + ' matching <b>' + args[0] + '</b>';
                } else {
                    return 'near ' + getJQueryContextButtonHTML(ctxt, onASingleLine);
                }
                break;

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

   function isStringOfObject(str) {
        return typeof str === 'string' && str[0] === '{' && str[str.length - 1] === '}';
    }

    function isPureString(str) {
        return typeof str === 'string' && str[0] !== '{' && str !== '(function)' && str !== '[Object]' && str !== '[Array]' && str !== 'true' && str !== 'false' && str !== 'undefined' && str !== 'unknown';
    }

    function getTimelineParamsHTML(node, onASingleLine) {
        if (isJQuery(node)) {
            return getJQueryHTML(node, onASingleLine);
        } else {
            return getNonJQueryHTML(node, onASingleLine);
        }
    }

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

    function getTimelineDetailsHTML(node) {
        var html = '';

        if (node.data.type != 'jQuery loaded' && node.data.type != 'jQuery version change' && !node.windowPerformance) {
            if (node.warning || node.error) {
                html += '<div class="icon-warning"></div>';
            } else {
                html += '<div class="icon-question"></div>';
            }

            html += '<div class="detailsOverlay">';
            html += '<div class="closeBtn">✖</div>';

            if (node.data.callDetails.context && node.data.callDetails.context.length === 0) {
                html += '<h4>Called on 0 jQuery element</h4><p class="advice">Useless function call, as the jQuery object is empty.</p>';
            } else if (node.eventNotDelegated) {
                html += '<p class="advice">This binding should use Event Delegation instead of binding each element one by one.</p>';
            }

            if (node.data.resultsNumber === 0) {
                html += '<p class="advice">The query returned 0 results. Could it be unused or dead code?</p>';
            } else if (node.data.resultsNumber > 0) {
                html += '<p>The query returned ' + node.data.resultsNumber + ' ' + (node.data.resultsNumber > 1 ? 'results' : 'result') + '.</p>';
            }

            if (node.data.backtrace) {
                html += '<h4>Backtrace</h4>';
                html += '<div class="table">';
                html += getBacktraceHTML(node.data.backtrace);
                html += '</div>';
            }

            html += '</div>';
        }
        
        return html;
    }

    
    offendersDirectives.directive('profilerLine', ['$filter', function($filter) {
        
        var numberWithCommas = $filter('number');

        function getProfilerLineHTML(index, node) {
            return  '<div class="index">' + (index + 1) + '</div>' +
                    '<div class="type">' + node.data.type + (node.children ? '<div class="children">' + recursiveChildrenHTML(node) + '</div>' : '') + '</div>' +
                    '<div class="value">' + getTimelineParamsHTML(node, false) + '</div>' +
                    '<div class="details">' + getTimelineDetailsHTML(node) + '</div>' +
                    '<div class="startTime ' + node.data.loadingStep + '">' + numberWithCommas(node.data.timestamp, 0) + ' ms</div>';
        }

        function recursiveChildrenHTML(node) {
            var html = '';
            
            if (node.children) {
                node.children.forEach(function(child) {
                    html += '<div class="child"><span>' + child.data.type + '<div class="childArgs">' + getTimelineParamsHTML(child, true) + '</div></span>' + recursiveChildrenHTML(child) + '</div>';
                });
            }

            return html;
        }

        function onDetailsClick(row) {
            // Close if it's alreay open
            if (row.classList.contains('showDetails')) {
                closeDetails(row);
                return;
            }

            // Close any other open details overlay
            var openOnes = document.getElementsByClassName('showDetails');
            if (openOnes.length > 0) {
                openOnes[0].classList.remove('showDetails');
            }

            // Make it appear
            row.classList.add('showDetails');

            // Bind the close button
            row.querySelector('.closeBtn').addEventListener('click', function() {
                closeDetails(row);
            });
        }

        function closeDetails(row) {
            row.classList.remove('showDetails');

            // Unbind the close button
            row.querySelector('.closeBtn').removeEventListener('click', closeDetails);   
        }

        return {
            restrict: 'E',
            scope: {
                index: '=',
                node: '='
            },
            template: '<div></div>',
            replace: true,
            link: function(scope, element) {
                
                if (scope.node.error) {
                    element.addClass('jsError');
                } else if (scope.node.windowPerformance) {
                    element.addClass('windowPerformance');
                }

                element.append(getProfilerLineHTML(scope.index, scope.node));
                element[0].id = 'line_' + scope.index;

                if (scope.node.warning) {
                    element[0].classList.add('warning');

                    if (scope.node.queryWithoutResults) {
                        element[0].classList.add('queryWithoutResults');
                    }

                    if (scope.node.jQueryCallOnEmptyObject) {
                        element[0].classList.add('jQueryCallOnEmptyObject');
                    }

                    if (scope.node.eventNotDelegated) {
                        element[0].classList.add('eventNotDelegated');
                    }
                }


                // Bind click on the details icon
                var detailsIcon = element[0].querySelector('.details div');
                if (detailsIcon) {
                    detailsIcon.addEventListener('click', function() {
                        onDetailsClick(this.parentNode.parentNode);
                    });
                }
            }
        };
    }]);

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

})();