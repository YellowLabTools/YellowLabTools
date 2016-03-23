/**
 * Analyzes jQuery activity
 *
 * @see http://code.jquery.com/jquery-1.10.2.js
 * @see http://code.jquery.com/jquery-2.0.3.js
 */
/* global document: true, window: true */
/* jshint -W030 */

exports.version = '1.0.a';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('jQueryVersion', ''); // @desc version of jQuery framework (if loaded) [string]
    phantomas.setMetric('jQueryVersionsLoaded'); // @desc number of loaded jQuery "instances" (even in the same version)
    phantomas.setMetric('jQueryOnDOMReadyFunctions'); // @desc number of functions bound to onDOMReady event
    phantomas.setMetric('jQueryWindowOnLoadFunctions'); // @desc number of functions bound to windowOnLoad event
    phantomas.setMetric('jQuerySizzleCalls'); // @desc number of calls to Sizzle (including those that will be resolved using querySelectorAll)
    phantomas.setMetric('jQueryEventTriggers'); // @desc number of jQuery event triggers

    var jQueryFunctions = [
        // DOM manipulations
        'html',
        'append',
        'appendTo',
        'prepend',
        'prependTo',
        'before',
        'insertBefore',
        'after',
        'insertAfter',
        'remove',
        'detach',
        'empty',
        'clone',
        'replaceWith',
        'replaceAll',
        'text',
        'wrap',
        'wrapAll',
        'wrapInner',
        'unwrap',

        // Style manipulations
        'css',
        'offset',
        'position',
        'height',
        'innerHeight',
        'outerHeight',
        'width',
        'innerWidth',
        'outerWidth',
        'scrollLeft',
        'scrollTop',

        // Animations
        'hide',
        'show',
        'toggle',
        'animate',
        'fadeIn',
        'fadeOut',
        'fadeTo',
        'fadeToggle',
        'slideDown',
        'slideUp',
        'slideToggle',

        // Generic events
        'on',
        'off',
        'live',
        'die',
        'delegate',
        'undelegate',
        'one',
        'bind',
        'unbind',

        // More events
        'blur',
        'change',
        'click',
        'dblclick',
        'error',
        'focus',
        'focusin',
        'focusout',
        'hover',
        'keydown',
        'keypress',
        'keyup',
        'load',
        'mousedown',
        'mouseenter',
        'mouseleave',
        'mousemove',
        'mouseout',
        'mouseover',
        'mouseup',
        'resize',
        'scroll',
        'select',
        'submit',
        'unload',

        // Attributes
        'attr',
        'prop',
        'removeAttr',
        'removeProp',
        'val',
        'hasClass',
        'addClass',
        'removeClass',
        'toggleClass',
    ];

    var jQueryTraversalFunctions = [
        'children',
        'closest',
        'find',
        'next',
        'nextAll',
        'nextUntil',
        'offsetParent',
        'parent',
        'parents',
        'parentsUntil',
        'prev',
        'prevAll',
        'prevUntil',
        'siblings'
    ];

    jQueryFunctions = jQueryFunctions.concat(jQueryTraversalFunctions);

    // spy calls to jQuery functions
    phantomas.on('init', function() {
        phantomas.evaluate(function(jQueryFunctions, jQueryTraversalFunctions) {
            (function(phantomas) {
                var oldJQuery;

                phantomas.spyGlobalVar('jQuery', function(jQuery) {
                    var version;

                    if (!jQuery || !jQuery.fn) {
                        phantomas.log('jQuery: unable to detect version!');
                        return;
                    }

                    // Tag the current version of jQuery to avoid multiple reports of jQuery being loaded
                    // when it's actually only restored via $.noConflict(true) - see comments in #435
                    if (jQuery.__phantomas === true) {
                        phantomas.log('jQuery: this instance has already been seen by phantomas');
                        return;
                    }
                    jQuery.__phantomas = true;

                    // report the version of jQuery
                    version = jQuery.fn.jquery;
                    phantomas.emit('jQueryLoaded', version);

                    phantomas.pushContext({
                        type: (oldJQuery) ? 'jQuery version change' : 'jQuery loaded',
                        callDetails: {
                            arguments: ['version ' + version]
                        },
                        backtrace: phantomas.getBacktrace()
                    });
                    oldJQuery = version;

                    // jQuery.ready.promise
                    // works for jQuery 1.8.0+ (released Aug 09 2012)
                    phantomas.spy(jQuery.ready, 'promise', function(func) {
                        phantomas.incrMetric('jQueryOnDOMReadyFunctions');
                        phantomas.addOffender('jQueryOnDOMReadyFunctions', phantomas.getCaller(3));

                        phantomas.pushContext({
                            type: 'jQuery - onDOMReady',
                            callDetails: {
                                arguments: [func]
                            },
                            backtrace: phantomas.getBacktrace()
                        });

                    }) || phantomas.log('jQuery: can not measure jQueryOnDOMReadyFunctions (jQuery used on the page is too old)!');


                    // Sizzle calls - jQuery.find
                    // works for jQuery 1.3+ (released Jan 13 2009)
                    phantomas.spy(jQuery, 'find', function(selector, context) {
                        phantomas.incrMetric('jQuerySizzleCalls');
                        phantomas.addOffender('jQuerySizzleCalls', '%s (in %s)', selector, (phantomas.getDOMPath(context) || 'unknown'));
                        
                        phantomas.enterContext({
                            type: 'jQuery - Sizzle call',
                            callDetails: {
                                context: {
                                    length: 1,
                                    elements: [phantomas.getDOMPath(context)]
                                },
                                arguments: [selector]
                            },
                            backtrace: phantomas.getBacktrace()
                        });

                    }, function(result) {
                        var moreData = {
                            resultsNumber : (result && result.length) ? result.length : 0
                        };
                        phantomas.leaveContext(moreData);
                    }) || phantomas.log('jQuery: can not measure jQuerySizzleCalls (jQuery used on the page is too old)!');


                    phantomas.spy(jQuery.fn, 'init', function(selector, context) {
                        if (typeof selector === 'string' && /^#([\w\-]*)$/.exec(selector) !== null && !context) {

                            phantomas.enterContext({
                                type: 'jQuery - find',
                                callDetails: {
                                    arguments: [selector]
                                },
                                backtrace: phantomas.getBacktrace()
                            });

                        }

                    }, function(result) {
                        var data = phantomas.getContextData();

                        if (data.type === 'jQuery - find' &&
                                !data.callDetails.context &&
                                data.callDetails.arguments.length === 1 &&
                                /^#([\w\-]*)$/.exec(data.callDetails.arguments[0]) !== null) {

                            var moreData = {
                                resultsNumber : (result && result.length) ? result.length : 0
                            };
                            phantomas.leaveContext(moreData);
                        }
                    });


                    if (!jQuery.event) {
                        phantomas.spy(jQuery.event, 'trigger', function(ev, data, elem) {
                            var path = phantomas.getDOMPath(elem),
                                type = ev.type || ev;

                            phantomas.log('Event: triggered "%s" on "%s"', type, path);

                            phantomas.incrMetric('jQueryEventTriggers');
                            phantomas.addOffender('jQueryEventTriggers', '"%s" on "%s"', type, path);
                        });
                    }

                    // jQuery events bound to window' onLoad event (#451)
                    phantomas.spy(jQuery.fn, 'on', function(eventName, func) {
                        if ((eventName === 'load') && (this[0] === window)) {
                            phantomas.incrMetric('jQueryWindowOnLoadFunctions');
                            phantomas.addOffender('jQueryWindowOnLoadFunctions', phantomas.getCaller(2));
                        }
                    });

                    // Add spys on many jQuery functions
                    jQueryFunctions.forEach(function(functionName) {
                        
                        phantomas.spy(jQuery.fn, functionName, function(args) {

                            // Clean args
                            args = [].slice.call(arguments);
                            args.forEach(function(arg, index) {
                                
                                if (arg instanceof Array) {
                                    arg = '[Array]';
                                }

                                if (arg instanceof Object) {
                                    
                                    if (arg instanceof jQuery || (arg.jquery && arg.jquery.length > 0)) {
                                        
                                        arg = phantomas.getDOMPath(arg[0]) || 'unknown';

                                    } else if (arg instanceof HTMLElement) {
                                        
                                        arg = phantomas.getDOMPath(arg) || 'unknown';

                                    } else if (typeof arg === 'function') {

                                        arg = '(function)';

                                    } else {
                                        
                                        try {

                                            for (var key in arg) {
                                                if (typeof arg[key] === 'function') {
                                                    arg[key] = '(function)';
                                                }
                                            }

                                            arg = JSON.stringify(arg);
                                        } catch(e) {
                                            arg = '[Object]';
                                        }
                                        
                                    }
                                }

                                if ((typeof arg === 'string' || arg instanceof String) && arg.length > 200) {
                                    arg = arg.substring(0, 200) + '...';
                                }

                                if (typeof arg === 'function') {
                                    arg = '(function)';
                                }

                                if (arg === true) {
                                    arg = 'true';
                                }

                                if (arg === false) {
                                    arg = 'false';
                                }

                                if (arg === null) {
                                    arg = 'null';
                                }

                                if (typeof arg !== 'number' && typeof arg !== 'string' && !(arg instanceof String)) {
                                    arg = 'undefined';
                                }

                                args[index] = arg;
                            });

                            var elements = [];
                            for (var i = 0 ; i < this.length ; i++) {
                                elements.push(phantomas.getDOMPath(this[i]));
                            }

                            phantomas.enterContext({
                                type: 'jQuery - ' + functionName,
                                callDetails: {
                                    context: {
                                        length: this.length,
                                        elements: elements
                                    },
                                    arguments: args
                                },
                                backtrace: phantomas.getBacktrace()
                            });

                        }, function(result) {
                            if (jQueryTraversalFunctions.indexOf(functionName) >= 0) {
                                var moreData = {
                                    resultsNumber : (result && result.length) ? result.length : 0
                                };
                                phantomas.leaveContext(moreData);
                            } else {
                                phantomas.leaveContext();
                            }
                        }) || phantomas.log('jQuery: can not track jQuery - ' + functionName + ' (this version of jQuery doesn\'t support it)');
                    });
                });
            })(window.__phantomas);
        }, jQueryFunctions, jQueryTraversalFunctions);
    });


    phantomas.on('jQueryLoaded', function(version) {
        phantomas.log('jQuery: loaded v' + version);
        phantomas.setMetric('jQueryVersion', version);

        // report multiple jQuery "instances" (issue #435)
        phantomas.incrMetric('jQueryVersionsLoaded');
        phantomas.addOffender('jQueryVersionsLoaded', 'v%s', version);
    });
};
