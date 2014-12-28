/**
 * Analyzes DOM complexity
 */
/* global document: true, Node: true, window: true */

exports.version = '1.0.a';

exports.module = function(phantomas) {
    'use strict';

    // total length of HTML comments (including <!-- --> brackets)
    phantomas.setMetric('commentsSize'); // @desc the size of HTML comments on the page @offenders

    // total length of text nodes with whitespaces only (i.e. pretty formatting of HTML)
    phantomas.setMetric('whiteSpacesSize'); // @desc the size of text nodes with whitespaces only

    // count all tags
    phantomas.setMetric('DOMelementsCount'); // @desc total number of HTML element nodes
    phantomas.setMetric('DOMelementMaxDepth'); // @desc maximum level on nesting of HTML element node

    // nodes with inlines CSS (style attribute)
    phantomas.setMetric('nodesWithInlineCSS'); // @desc number of nodes with inline CSS styling (with style attribute) @offenders

    // images
    phantomas.setMetric('imagesScaledDown'); // @desc number of <img> nodes that have images scaled down in HTML @offenders
    phantomas.setMetric('imagesWithoutDimensions'); // @desc number of <img> nodes without both width and height attribute @offenders

    // duplicated ID (issue #392)
    phantomas.setMetric('DOMidDuplicated'); // @desc number of duplicated IDs found in DOM

    var Collection = require('../../../../../../node_modules/phantomas/lib/collection'),
        DOMids = new Collection();

    phantomas.on('domId', function(id) {
        DOMids.push(id);
    });

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

                            // report duplicated ID (issue #392)
                            if (node.id) {
                                phantomas.emit('domId', node.id);
                            }

                            // ignore inline <script> tags
                            if (node.nodeName === 'SCRIPT') {
                                return false;
                            }

                            // images
                            if (node.nodeName === 'IMG') {
                                if (!node.hasAttribute('width') || !node.hasAttribute('height')) {
                                    phantomas.incrMetric('imagesWithoutDimensions');
                                    phantomas.addOffender('imagesWithoutDimensions', '%s <%s>', phantomas.getDOMPath(node), node.src);
                                }
                                if (node.naturalHeight && node.naturalWidth && node.height && node.width) {
                                    if (node.naturalHeight > node.height || node.naturalWidth > node.width) {
                                        phantomas.incrMetric('imagesScaledDown');
                                        phantomas.addOffender('imagesScaledDown', '%s (%dx%d -> %dx%d)', node.src, node.naturalWidth, node.naturalHeight, node.width, node.height);
                                    }
                                }
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

                phantomas.spyEnabled(true);
            }(window.__phantomas));
        });

        DOMids.sort().forEach(function(id, cnt) {
            if (cnt > 1) {
                phantomas.incrMetric('DOMidDuplicated');
                phantomas.addOffender('DOMidDuplicated', '%s: %d occurrences', id, cnt);
            }
        });
    });
};
