/**
 * Analyzes DOM complexity
 */
/* global document: true, Node: true, window: true */

exports.version = '0.4.a';

exports.module = function(phantomas) {
    'use strict';

    // total length of HTML comments (including <!-- --> brackets)
    phantomas.setMetric('commentsSize'); // @desc the size of HTML comments on the page @offenders

    // total length of text nodes with whitespaces only (i.e. pretty formatting of HTML)
    phantomas.setMetric('whiteSpacesSize'); // @desc the size of text nodes with whitespaces only

    // count all tags
    phantomas.setMetric('DOMelementsCount'); // @desc total number of HTML element nodes
    phantomas.setMetric('DOMelementMaxDepth'); // @desc maximum level on nesting of HTML element node

    phantomas.setMetric('DOMidDuplicated'); // @desc duplicated id found in DOM

    // nodes with inlines CSS (style attribute)
    phantomas.setMetric('nodesWithInlineCSS'); // @desc number of nodes with inline CSS styling (with style attribute) @offenders

    // HTML size
    phantomas.on('report', function() {
        phantomas.setMetricEvaluate('bodyHTMLSize', function() { // @desc the size of body tag content (document.body.innerHTML.length)
            return document.body && document.body.innerHTML.length || 0;
        });

        phantomas.evaluate(function() {
            (function(phantomas) {
                var runner = new phantomas.nodeRunner(),
                    whitespacesRegExp = /^\s+$/,
                    DOMelementMaxDepth = 0,
                    DOMelementMaxDepthElts = [],
                    size = 0;

                // include all nodes
                runner.isSkipped = function(node) {
                    return false;
                };

                runner.walk(document.body, function(node, depth) {
                    switch (node.nodeType) {
                        case Node.COMMENT_NODE:
                            size = node.textContent.length + 7; // '<!--' + '-->'.length
                            phantomas.incrMetric('commentsSize', size);

                            // log HTML comments bigger than 64 characters
                            if (size > 64) {
                                phantomas.addOffender('commentsSize', phantomas.getDOMPath(node) + ' (' + size + ' characters)');
                            }
                            break;

                        case Node.ELEMENT_NODE:
                            phantomas.incrMetric('DOMelementsCount');
                            
                            if (depth > DOMelementMaxDepth) {
                                DOMelementMaxDepth = depth;
                                DOMelementMaxDepthElts = [phantomas.getDOMPath(node)];
                            } else if (depth === DOMelementMaxDepth) {
                                DOMelementMaxDepthElts.push(phantomas.getDOMPath(node));
                            }

                            if (node.id) {
                                // Send id to a collection so that duplicated ids can be counted
                                phantomas.emit('domId', node.id);
                            }

                            // ignore inline <script> tags
                            if (node.nodeName === 'SCRIPT') {
                                return false;
                            }

                            // count nodes with inline CSS
                            if (node.hasAttribute('style')) {
                                phantomas.incrMetric('nodesWithInlineCSS');
                                phantomas.addOffender('nodesWithInlineCSS', phantomas.getDOMPath(node) + ' (' + node.getAttribute('style')  + ')');
                            }

                            break;

                        case Node.TEXT_NODE:
                            if (whitespacesRegExp.test(node.textContent)) {
                                phantomas.incrMetric('whiteSpacesSize', node.textContent.length);
                            }
                            break;
                    }
                });

                phantomas.setMetric('DOMelementMaxDepth', DOMelementMaxDepth);
                DOMelementMaxDepthElts.forEach(function(path) {
                    phantomas.addOffender('DOMelementMaxDepth', path);
                });

                phantomas.spyEnabled(false, 'counting iframes and images');

                // count <iframe> tags
                phantomas.setMetric('iframesCount', document.querySelectorAll('iframe').length); // @desc number of iframe nodes

                // <img> nodes without dimensions (one of width / height missing)
                phantomas.setMetric('imagesWithoutDimensions', (function() { // @desc number of <img> nodes without both width and height attribute @offenders
                    var imgNodes = document.body && document.body.querySelectorAll('img') || [],
                        node,
                        imagesWithoutDimensions = 0;

                    for (var i=0, len=imgNodes.length; i<len; i++) {
                        node = imgNodes[i];
                        if (!node.hasAttribute('width') || !node.hasAttribute('height')) {
                            phantomas.addOffender('imagesWithoutDimensions', phantomas.getDOMPath(node));
                            imagesWithoutDimensions++;
                        }
                    }

                    return imagesWithoutDimensions;
                })());

                phantomas.spyEnabled(true);
            }(window.__phantomas));
        });
    });

    // count ids in DOM to detect duplicated ids
    // @see https://dvcs.w3.org/hg/domcore/raw-file/tip/Overview.html#dom-document-doctype
    var Collection = require('../../../node_modules/phantomas/lib/collection'),
        DOMids = new Collection();

    phantomas.on('domId', function(id) {
        DOMids.push(id);
    });

    phantomas.on('report', function() {
        phantomas.log('Looking for duplicated DOM ids');
        DOMids.sort().forEach(function(id, cnt) {
            if (cnt > 1) {
                phantomas.incrMetric('DOMidDuplicated');
                phantomas.addOffender('DOMidDuplicated', '%s: %d', id, cnt);
            }
        });
    });
};