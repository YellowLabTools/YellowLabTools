/**
 * Adds CSS related metrics using analyze-css NPM module
 *
 * @see https://github.com/macbre/analyze-css
 *
 * Run phantomas with --analyze-css option to use this module
 *
 * setMetric('cssBase64Length') @desc total length of base64-encoded data in CSS source (will warn about base64-encoded data bigger than 4 kB) @optional @offenders
 * setMetric('cssRedundantBodySelectors') @desc number of redundant body selectors (e.g. body .foo, section body h2, but not body > h1) @optional @offenders
 * setMetric('cssComments') @desc number of comments in CSS source @optional @offenders
 * setMetric('cssCommentsLength') @desc length of comments content in CSS source @optional
 * setMetric('cssComplexSelectors') @desc number of complex selectors (consisting of more than three expressions, e.g. header ul li .foo) @optional @offenders
 * setMetric('cssDuplicatedSelectors') @desc number of CSS selectors defined more than once in CSS source @optional @offenders
 * setMetric('cssEmptyRules') @desc number of rules with no properties (e.g. .foo { }) @optional @offenders
 * setMetric('cssExpressions') @desc number of rules with CSS expressions (e.g. expression( document.body.clientWidth > 600 ? "600px" : "auto" )) @optional @offenders
 * setMetric('cssOldIEFixes') @desc number of fixes for old versions of Internet Explorer (e.g. * html .foo {} and .foo { *zoom: 1 }) @optional @offenders
 * setMetric('cssImportants') @desc number of properties with value forced by !important @optional @offenders
 * setMetric('cssMediaQueries') @desc number of media queries (e.g. @media screen and (min-width: 1370px)) @optional @offenders
 * setMetric('cssOldPropertyPrefixes') @desc number of properties with no longer needed vendor prefix, powered by data provided by autoprefixer (e.g. --moz-border-radius) @optional @offenders
 * setMetric('cssQualifiedSelectors') @desc number of qualified selectors (e.g. header#nav, .foo#bar, h1.title) @optional @offenders
 * setMetric('cssSpecificityIdAvg') @desc average specificity for ID @optional
 * setMetric('cssSpecificityIdTotal') @desc total specificity for ID @optional
 * setMetric('cssSpecificityClassAvg') @desc average specificity for class, pseudo-class or attribute @optional
 * setMetric('cssSpecificityClassTotal') @desc total specificity for class, pseudo-class or attribute @optional
 * setMetric('cssSpecificityTagAvg') @desc average specificity for element @optional
 * setMetric('cssSpecificityTagTotal') @desc total specificity for element @optional
 * setMetric('cssSelectorsByAttribute') @desc number of selectors by attribute (e.g. .foo[value=bar]) @optional
 * setMetric('cssSelectorsByClass') @desc number of selectors by class @optional
 * setMetric('cssSelectorsById') @desc number of selectors by ID @optional
 * setMetric('cssSelectorsByPseudo') @desc number of pseudo-selectors (e,g. :hover) @optional
 * setMetric('cssSelectorsByTag') @desc number of selectors by tag name @optional
 * setMetric('cssUniversalSelectors') @desc number of selectors trying to match every element (e.g. .foo > *) @optional @offenders
 * setMetric('cssLength') @desc length of CSS source (in bytes) @optional
 * setMetric('cssRules') @desc number of rules (e.g. .foo, .bar { color: red } is counted as one rule) @optional
 * setMetric('cssSelectors') @desc number of selectors (e.g. .foo, .bar { color: red } is counted as two selectors - .foo and .bar) @optional
 * setMetric('cssDeclarations') @desc number of declarations (e.g. .foo, .bar { color: red } is counted as one declaration - color: red) @optional
 * setMetric('cssParsingErrors') @desc number of CSS files (or embeded CSS) that failed to be parse by analyse-css @optional
 */

exports.version = '0.3.a';

exports.module = function(phantomas) {
    'use strict';

    if (!phantomas.getParam('analyze-css')) {
        phantomas.log('To enable CSS in-depth metrics please run phantomas with --analyze-css option');
        return;
    }

    function ucfirst(str) {
        // http://kevin.vanzonneveld.net
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Onno Marsman
        // +   improved by: Brett Zamir (http://brett-zamir.me)
        // *     example 1: ucfirst('kevin van zonneveld');
        // *     returns 1: 'Kevin van zonneveld'
        str += '';
        var f = str.charAt(0).toUpperCase();
        return f + str.substr(1);
    }

    var isWindows = (require('system').os.name === 'windows'),
        binary = isWindows ? 'analyze-css.cmd' : 'analyze-css';

    phantomas.on('recv', function(entry, res) {
        if (entry.isCSS) {
            phantomas.log('CSS: analyzing <%s>...', entry.url);

            // run analyze-css "binary" installed by npm
            phantomas.runScript('node_modules/.bin/' + binary, ['--url', entry.url, '--json'], function(err, results) {
                if (err !== null) {
                    phantomas.log('analyzeCss: sub-process failed!');

                    var offender = entry.url;
                    if (err.indexOf('near line') > 0) {
                        offender += ' (' + err + ')';
                    }

                    phantomas.incrMetric('cssParsingErrors');
                    phantomas.addOffender('cssParsingErrors', offender);
                    
                    return;
                }

                phantomas.log('analyzeCss: using ' + results.generator);

                var metrics = results.metrics || {},
                    offenders = results.offenders || {};

                Object.keys(metrics).forEach(function(metric) {
                    var metricPrefixed = 'css' + ucfirst(metric);

                    // increase metrics
                    phantomas.incrMetric(metricPrefixed, metrics[metric]);

                    // and add offenders
                    if (typeof offenders[metric] !== 'undefined') {
                        offenders[metric].forEach(function(msg) {
                            phantomas.addOffender(metricPrefixed, msg);
                        });
                    }
                });
            });
        }
    });
};
