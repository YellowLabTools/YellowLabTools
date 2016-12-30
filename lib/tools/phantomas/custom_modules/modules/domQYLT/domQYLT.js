/**
 * Analyzes DOM queries done via native DOM methods
 */
/* global Element: true, Document: true, Node: true, window: true */

exports.version = '0.10.a';

exports.module = function(phantomas) {
    'use strict';

    phantomas.setMetric('DOMqueries'); // @desc number of all DOM queries @offenders
    phantomas.setMetric('DOMqueriesWithoutResults'); // @desc number of DOM queries that retutned nothing @offenders
    phantomas.setMetric('DOMqueriesById'); // @desc number of document.getElementById calls
    phantomas.setMetric('DOMqueriesByClassName'); // @desc number of document.getElementsByClassName calls
    phantomas.setMetric('DOMqueriesByTagName'); // @desc number of document.getElementsByTagName calls
    phantomas.setMetric('DOMqueriesByQuerySelectorAll'); // @desc number of document.querySelector(All) calls
    phantomas.setMetric('DOMinserts'); // @desc number of DOM nodes inserts
    phantomas.setMetric('DOMqueriesDuplicated'); // @desc number of DOM queries called more than once
    phantomas.setMetric('DOMqueriesAvoidable'); // @desc number of repeated uses of a duplicated query

    // fake native DOM functions
    phantomas.on('init', function() {
        phantomas.evaluate(function() {
            (function(phantomas) {
                function querySpy(type, query, fnName, context, hasNoResults) {
                    phantomas.emit('domQuery', type, query, fnName, context, hasNoResults); // @desc DOM query has been made
                }

                phantomas.spy(Document.prototype, 'getElementById', function(id) {
                    phantomas.incrMetric('DOMqueriesById');
                    phantomas.addOffender('DOMqueriesById', '#%s (in %s)', id, '#document');

                    phantomas.enterContext({
                        type: 'getElementById',
                        callDetails: {
                            arguments: ['#' + id]
                        },
                        backtrace: phantomas.getBacktrace()
                    });

                }, function(result, args) {
                    var id = args ? '#' + args[0] : undefined;

                    querySpy('id', id, 'getElementById', '#document', (result === null));

                    var moreData = {
                        resultsNumber : (result === null) ? 0 : 1
                    };
                    phantomas.leaveContext(moreData);
                });

                // selectors by class name
                function selectorClassNameSpyBefore(className) {
                    /*jshint validthis: true */

                    var context = phantomas.getDOMPath(this);

                    phantomas.incrMetric('DOMqueriesByClassName');
                    phantomas.addOffender('DOMqueriesByClassName', '.%s (in %s)', className, context);

                    phantomas.enterContext({
                        type: 'getElementsByClassName',
                        callDetails: {
                            context: {
                                length: 1,
                                elements: [context]
                            },
                            arguments: ['.' + className]
                        },
                        backtrace: phantomas.getBacktrace()
                    });
                }

                function selectorClassNameAfter(result, args) {
                    /*jshint validthis: true */

                    var className = args ? '.' + args[0] : undefined;
                    var context = phantomas.getDOMPath(this);

                    querySpy('class', className, 'getElementsByClassName', context, (result.length === 0));
                    
                    var moreData = {
                        resultsNumber : (result && result.length > 0) ? result.length : 0
                    };
                    phantomas.leaveContext(moreData);
                }

                phantomas.spy(Document.prototype, 'getElementsByClassName', selectorClassNameSpyBefore, selectorClassNameAfter);
                phantomas.spy(Element.prototype, 'getElementsByClassName', selectorClassNameSpyBefore, selectorClassNameAfter);

                // selectors by tag name
                function selectorTagNameSpyBefore(tagName) {
                    /*jshint validthis: true */

                    var context = phantomas.getDOMPath(this);

                    phantomas.incrMetric('DOMqueriesByTagName');
                    phantomas.addOffender('DOMqueriesByTagName', '%s (in %s)', tagName, context);

                    phantomas.enterContext({
                        type: 'getElementsByTagName',
                        callDetails: {
                            context: {
                                length: 1,
                                elements: [context]
                            },
                            arguments: [tagName]
                        },
                        backtrace: phantomas.getBacktrace()
                    });
                }

                function selectorTagNameSpyAfter(result, args) {
                    /*jshint validthis: true */
                    
                    var tagName = args ? args[0].toLowerCase() : undefined;
                    var context = phantomas.getDOMPath(this);

                    querySpy('tag name', tagName, 'getElementsByTagName', context, (result.length === 0));
                    
                    var moreData = {
                        resultsNumber : (result && result.length > 0) ? result.length : 0
                    };
                    phantomas.leaveContext(moreData);
                }

                phantomas.spy(Document.prototype, 'getElementsByTagName', selectorTagNameSpyBefore, selectorTagNameSpyAfter);
                phantomas.spy(Element.prototype, 'getElementsByTagName', selectorTagNameSpyBefore, selectorTagNameSpyAfter);


                // selector queries
                function selectorQuerySpy(selector, context) {
                    phantomas.incrMetric('DOMqueriesByQuerySelectorAll');
                    phantomas.addOffender('DOMqueriesByQuerySelectorAll', '%s (in %s)', selector, context);
                }

                function selectorQuerySpyBefore(selector) {
                    /*jshint validthis: true */

                    var context = phantomas.getDOMPath(this);
                    selectorQuerySpy(selector, context);

                    phantomas.enterContext({
                        type: 'querySelector',
                        callDetails: {
                            context: {
                                length: 1,
                                elements: [context]
                            },
                            arguments: [selector]
                        },
                        backtrace: phantomas.getBacktrace()
                    });
                }

                function selectorQuerySpyAfter(result, args) {
                    /*jshint validthis: true */

                    var selector = args ? args[0] : undefined;
                    var context = phantomas.getDOMPath(this);

                    querySpy('selector', selector, 'querySelectorAll', context, (!result || result.length === 0));
                    
                    var moreData = {
                        resultsNumber : result ? 1 : 0
                    };
                    phantomas.leaveContext(moreData);
                }

                function selectorAllQuerySpyBefore(selector) {
                    /*jshint validthis: true */

                    var context = phantomas.getDOMPath(this);
                    selectorQuerySpy(selector, context);

                    phantomas.enterContext({
                        type: 'querySelectorAll',
                        callDetails: {
                            context: {
                                length: 1,
                                elements: [context]
                            },
                            arguments: [selector]
                        },
                        backtrace: phantomas.getBacktrace()
                    });
                }

                function selectorAllQuerySpryAfter(result, args) {
                    /*jshint validthis: true */

                    var selector = args ? args[0] : undefined;
                    var context = phantomas.getDOMPath(this);

                    querySpy('selector', selector, 'querySelectorAll', context, (!result || result.length === 0));

                    var moreData = {
                        resultsNumber : (result && result.length > 0) ? result.length : 0
                    };
                    phantomas.leaveContext(moreData);
                }

                phantomas.spy(Document.prototype, 'querySelector', selectorQuerySpyBefore, selectorQuerySpyAfter);
                phantomas.spy(Document.prototype, 'querySelectorAll', selectorAllQuerySpyBefore, selectorAllQuerySpryAfter);
                phantomas.spy(Element.prototype, 'querySelector', selectorQuerySpyBefore, selectorQuerySpyAfter);
                phantomas.spy(Element.prototype, 'querySelectorAll', selectorAllQuerySpyBefore, selectorAllQuerySpryAfter);


                // count DOM inserts
                function appendChild(child, element, context, appended) {
                    /*jshint validthis: true */

                    // ignore appending to the node that's not yet added to DOM tree
                    if (!element.parentNode) {
                        return;
                    }

                    // don't count elements added to fragments as a DOM inserts (issue #350)
                    // DocumentFragment > div[0]
                    if (context.indexOf('DocumentFragment') === 0) {
                        return;
                    }

                    phantomas.incrMetric('DOMinserts');
                    phantomas.addOffender('DOMinserts', '"%s" appended to "%s"', appended, context);

                    //phantomas.log('DOM insert: node "%s" appended to "%s"', appended, context);
                }

                function appendChildSpyBefore(child) {
                    /*jshint validthis: true */

                    var context = phantomas.getDOMPath(this);
                    var appended = phantomas.getDOMPath(child);
                    appendChild(child, this, context, appended);

                    phantomas.enterContext({
                        type: 'appendChild',
                        callDetails: {
                            context: {
                                length: 1,
                                elements: [context]
                            },
                            arguments: [appended]
                        },
                        backtrace: phantomas.getBacktrace()
                    });
                }

                function insertBeforeSpyBefore(child, refElement) {
                    /*jshint validthis: true */
                    
                    var context = phantomas.getDOMPath(this);
                    var appended = phantomas.getDOMPath(child);
                    var referent = phantomas.getDOMPath(refElement);
                    appendChild(child, this, context, appended);

                    phantomas.enterContext({
                        type: 'insertBefore',
                        callDetails: {
                            context: {
                                length: 1,
                                elements: [context]
                            },
                            arguments: [
                                appended,
                                referent
                            ]
                        },
                        backtrace: phantomas.getBacktrace()
                    });
                }

                phantomas.spy(Node.prototype, 'appendChild', appendChildSpyBefore, function(result) {
                    phantomas.leaveContext();
                });
                phantomas.spy(Node.prototype, 'insertBefore', insertBeforeSpyBefore, function(result) {
                    phantomas.leaveContext();
                });


                phantomas.spy(Document.prototype, 'createElement', function(tagName) {
                    
                    phantomas.enterContext({
                        type: 'createElement',
                        callDetails: {
                            arguments: [tagName]
                        },
                        backtrace: phantomas.getBacktrace()
                    });

                }, function(result, args) {
                    phantomas.leaveContext();
                });


                phantomas.spy(Document.prototype, 'createTextNode', function(text) {
                    
                    phantomas.enterContext({
                        type: 'createTextNode',
                        callDetails: {
                            arguments: [text]
                        },
                        backtrace: phantomas.getBacktrace()
                    });

                }, function(result, args) {
                    phantomas.leaveContext();
                });


                phantomas.spy(Document.prototype, 'createDocumentFragment', function() {
                    
                    phantomas.enterContext({
                        type: 'createDocumentFragment',
                        callDetails: {
                            arguments: []
                        },
                        backtrace: phantomas.getBacktrace()
                    });

                }, function(result, args) {
                    phantomas.leaveContext();
                });


                phantomas.spy(window, 'getComputedStyle', function(element, pseudoElement) {
                    var target = phantomas.getDOMPath(element);
                    
                    phantomas.enterContext({
                        type: 'getComputedStyle',
                        callDetails: {
                            arguments: [target, pseudoElement]
                        },
                        backtrace: phantomas.getBacktrace()
                    });

                }, function(result, args) {
                    phantomas.leaveContext();
                });

            })(window.__phantomas);
        });
    });

    // report DOM queries that return no results (issue #420)
    phantomas.on('domQuery', function(type, query, fnName, context, hasNoResults) {
        // ignore DOM queries within DOM fragments (used internally by jQuery)
        if (context.indexOf('body') !== 0 && context.indexOf('#document') !== 0) {
            return;
        }

        if (hasNoResults === true) {
            phantomas.incrMetric('DOMqueriesWithoutResults');
            phantomas.addOffender('DOMqueriesWithoutResults', '%s (in %s) using %s', query, context, fnName);
        }
    });

    // count DOM queries by either ID, tag name, class name and selector query
    // @see https://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#dom-document-doctype
    var Collection = require('../../util/collection'),
        DOMqueries = new Collection();

    phantomas.on('domQuery', function(type, query, fnName, context) {
        phantomas.log('DOM query: by %s - "%s" (using %s) in %s', type, query, fnName, context);
        phantomas.incrMetric('DOMqueries');

        if (context && (
                context.indexOf('html') === 0 ||
                context.indexOf('body') === 0 ||
                context.indexOf('head') === 0 ||
                context.indexOf('#document') === 0
            )) {
            DOMqueries.push(type + ' "' + query + '" with ' + fnName + ' (in context ' + context + ')');
        }
    });

    phantomas.on('report', function() {
        DOMqueries.sort().forEach(function(query, cnt) {
            if (cnt > 1) {
                phantomas.incrMetric('DOMqueriesDuplicated');
                phantomas.incrMetric('DOMqueriesAvoidable', cnt - 1);
                phantomas.addOffender('DOMqueriesDuplicated', '%s: %d queries', query, cnt);
            }
        });
    });
};