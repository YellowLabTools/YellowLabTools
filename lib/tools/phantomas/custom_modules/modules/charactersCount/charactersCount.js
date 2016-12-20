/**
 * Lists the number of different characters
 */
/* global document: true, Node: true, window: true */

exports.version = '1.0';

exports.module = function(phantomas) {
    'use strict';

    //phantomas.setMetric('differentCharacters'); // @desc the number of different characters in the body @offenders

    phantomas.on('report', function() {
        phantomas.log("charactersCount: starting to analyze characters on page...");

        phantomas.evaluate(function() {
            (function(phantomas) {

                phantomas.spyEnabled(false, 'analyzing characters on page');

                function getLetterCount(arr){
                    return arr.reduce(function(prev, next){
                        prev[next] = 1;
                        return prev;
                    }, {});
                }

                if (document.body && document.body.textContent) {
                    var allText = '';

                    // Traverse all DOM Tree to read text
                    var runner = new phantomas.nodeRunner();
                    runner.walk(document.body, function(node, depth) {
                        switch (node.nodeType) {

                            // Grabing text nodes
                            case Node.TEXT_NODE:
                                if (node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') {
                                    allText += node.nodeValue;
                                }
                                break;

                            // Grabing CSS content properties
                            case Node.ELEMENT_NODE:
                                if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
                                    allText += window.getComputedStyle(node).getPropertyValue('content');
                                    allText += window.getComputedStyle(node, ':before').getPropertyValue('content');
                                    allText += window.getComputedStyle(node, ':after').getPropertyValue('content');
                                }
                                break;
                        }
                    });

                    // Reduce all text found in page into a string of unique chars
                    var charactersList = getLetterCount(allText.split(''));
                    var charsetString = Object.keys(charactersList).sort().join('');
                    
                    // Remove blank characters
                    charsetString = charsetString.replace(/\s/g, '');

                    phantomas.setMetric('differentCharacters', charsetString.length);
                    phantomas.addOffender('differentCharacters', charsetString);
                }

                phantomas.spyEnabled(true);
            }(window.__phantomas));
        });

        phantomas.log("charactersCount: analyzing characters done.");
    });
};
