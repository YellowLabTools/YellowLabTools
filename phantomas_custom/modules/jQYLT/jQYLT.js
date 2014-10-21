/**
 * Analyzes jQuery activity
 *
 * @see http://code.jquery.com/jquery-1.10.2.js
 * @see http://code.jquery.com/jquery-2.0.3.js
 */
/* global document: true, window: true */
/* jshint -W030 */

exports.version = '0.2.a';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('jQueryVersion', ''); // @desc version of jQuery framework (if loaded) [string]
    phantomas.setMetric('jQueryOnDOMReadyFunctions'); // @desc number of functions bound to onDOMReady event
    phantomas.setMetric('jQuerySizzleCalls'); // @desc number of calls to Sizzle (including those that will be resolved using querySelectorAll)
    phantomas.setMetric('jQuerySizzleCallsDuplicated'); // @desc number of calls on the same Sizzle request
    phantomas.setMetric('jQueryBindOnMultipleElements'); //@desc number of calls to jQuery bind function on 2 or more elements
    phantomas.setMetric('jQueryDifferentVersions'); //@desc number of different jQuery versions loaded on the page (not counting iframes)

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

        // generic events
        'on',
        'off',
        'live',
        'die',
        'delegate',
        'undelegate',
        'one',
        'unbind',

        // more events
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
        'toggle',
        'unload',

        // attributes
        'attr',
        'prop',
        'removeAttr',
        'removeProp',
        'val',
        'hasClass',
        'addClass',
        'removeClass',
        'toggleClass'
    ];

    // spy calls to jQuery functions
    phantomas.once('init', function() {
        phantomas.evaluate(function(jQueryFunctions) {
            (function(phantomas) {
                var jQuery;

                // TODO: create a helper - phantomas.spyGlobalVar() ?
                window.__defineSetter__('jQuery', function(val) {
                    var version;
                    var jQueryFn;
                    var oldJQuery = jQuery;

                    if (!val || !val.fn) {
                        phantomas.log('jQuery: unable to detect version!');
                        return;
                    }

                    version = val.fn.jquery;
                    jQuery = val;
                    jQueryFn = val.fn;
                    // Older jQuery (v?.?) compatibility
                    if (!jQueryFn) {
                        jQueryFn = jQuery;
                    }

                    phantomas.log('jQuery: loaded v' + version);
                    phantomas.setMetric('jQueryVersion', version);
                    phantomas.emit('jQueryLoaded', version);
                    
                    phantomas.pushContext({
                        type: (oldJQuery) ? 'jQuery version change' : 'jQuery loaded',
                        callDetails: {
                            arguments: ['version ' + version]
                        },
                        backtrace: phantomas.getBacktrace()
                    });

                    // jQuery.ready.promise
                    // works for jQuery 1.8.0+ (released Aug 09 2012)
                    phantomas.spy(val.ready, 'promise', function(func) {
                        phantomas.incrMetric('jQueryOnDOMReadyFunctions');

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
                    phantomas.spy(val, 'find', function(selector, context) {
                        phantomas.incrMetric('jQuerySizzleCalls');
                        phantomas.emit('onSizzleCall', selector + ' (context: ' + (phantomas.getDOMPath(context) || 'unknown') + ')');
                        
                        phantomas.enterContext({
                            type: 'jQuery - find',
                            callDetails: {
                                context: {
                                    length: this.length,
                                    firstElementPath: phantomas.getDOMPath(context)
                                },
                                arguments: [selector]
                            },
                            backtrace: phantomas.getBacktrace()
                        });

                    }, phantomas.leaveContext) || phantomas.log('jQuery: can not measure jQuerySizzleCalls (jQuery used on the page is too old)!');

                    
                    // $().bind - jQuery.bind
                    // works for jQuery v?.?
                    phantomas.spy(jQueryFn, 'bind', function(eventTypes, func) {
                        
                        phantomas.enterContext({
                            type: 'jQuery - bind',
                            callDetails: {
                                context: {
                                    length: this.length,
                                    firstElementPath: phantomas.getDOMPath(this[0]),
                                    selector: this.selector
                                },
                                arguments: [eventTypes, func]
                            },
                            backtrace: phantomas.getBacktrace()
                        });

                    }, function(eventTypes, func) {
                        phantomas.leaveContext();

                        if (this.length > 1) {
                            phantomas.incrMetric('jQueryBindOnMultipleElements');
                            phantomas.addOffender('jQueryBindOnMultipleElements', '%s (%s on %d elements)', this.selector, eventTypes, this.length);
                        }
                        
                    }) || phantomas.log('jQuery: can not measure jQueryBindCalls (jQuery used on the page is too old)!');



                    // Add spys on many jQuery functions
                    jQueryFunctions.forEach(function(functionName) {
                        var capitalizedName = functionName.substring(0,1).toUpperCase() + functionName.substring(1);
                        
                        phantomas.spy(jQueryFn, functionName, function(args) {

                            // Clean args
                            args = [].slice.call(arguments);
                            args.forEach(function(arg, index) {
                                
                                if (arg instanceof Object) {
                                    
                                    if (arg instanceof jQuery || (arg.jquery && arg.jquery.length > 0)) {
                                        
                                        arg = phantomas.getDOMPath(arg[0]) || 'unknown';

                                    } else if (arg instanceof HTMLElement) {
                                        
                                        arg = phantomas.getDOMPath(arg) || 'unknown';

                                    } else {
                                        
                                        try {
                                            arg = JSON.stringify(arg);
                                        } catch(e) {
                                            arg = '[Object]';
                                        }
                                        
                                    }
                                }

                                if ((typeof arg == 'string' || arg instanceof String) && arg.length > 200) {
                                    arg = arg.substring(0, 200) + '...';
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


                            phantomas.enterContext({
                                type: 'jQuery - ' + functionName,
                                callDetails: {
                                    context: {
                                        length: this.length,
                                        firstElementPath: phantomas.getDOMPath(this[0])
                                    },
                                    arguments: args
                                },
                                backtrace: phantomas.getBacktrace()
                            });

                        }, phantomas.leaveContext) || phantomas.log('jQuery: can not track jQuery - ' + capitalizedName + ' (this version of jQuery doesn\'t support it)');
                    });


                });

                window.__defineGetter__('jQuery', function() {
                    return jQuery;
                });
            })(window.__phantomas);
        }, jQueryFunctions);
    });


    // count Sizzle calls to detect duplicated queries
    var Collection = require('../../../node_modules/phantomas/lib/collection'),
        sizzleCalls = new Collection(),
        jQueryLoading = new Collection();

    phantomas.on('onSizzleCall', function(request) {
        sizzleCalls.push(request);
    });

    phantomas.on('jQueryLoaded', function(version) {
        jQueryLoading.push(version);
    });

    phantomas.on('report', function() {
        sizzleCalls.sort().forEach(function(id, cnt) {
            if (cnt > 1) {
                phantomas.incrMetric('jQuerySizzleCallsDuplicated');
                phantomas.addOffender('jQuerySizzleCallsDuplicated', '%s: %d', id, cnt);
            }
        });

        jQueryLoading.forEach(function(version) {
            phantomas.incrMetric('jQueryDifferentVersions');
            phantomas.addOffender('jQueryDifferentVersions', '%s', version);
        });
    });
};
