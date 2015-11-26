var debug   = require('debug')('ylt:mediaQueriesChecker');
var parseMediaQuery = require('css-mq-parser');
var offendersHelpers = require('../offendersHelpers');


var mediaQueriesChecker = function() {
    'use strict';

    var MOBILE_MIN_BREAKPOINT = 200;
    var MOBILE_MAX_BREAKPOINT = 300;

    this.analyzeMediaQueries = function(data) {
        debug('Starting to check all media queries...');

        var offenders = data.toolsResults.phantomas.offenders.cssMediaQueries;
        var mediaQueries = (offenders) ? this.parseAllMediaQueries(offenders) : [];
        
        var notMobileFirstCount = 0;
        var notMobileFirstOffenders = [];

        var breakpointsOffenders = {};

        for (var i = 0; i < mediaQueries.length; i++) {
            var item = mediaQueries[i];

            if (!item) {
                continue;
            }

            if (item.isForMobile) {
                notMobileFirstCount += item.mediaQuery.rules;
                notMobileFirstOffenders.push(item.mediaQuery);
            }

            for (var j = 0; j < item.breakpoints.length; j++) {
                var breakpointString = item.breakpoints[j].string;
                if (!breakpointsOffenders[breakpointString]) {
                    breakpointsOffenders[breakpointString] = {
                        count: 1,
                        pixels: item.breakpoints[j].pixels
                    };
                } else {
                    breakpointsOffenders[breakpointString].count += 1;
                }
            }
        }

        data.toolsResults.mediaQueriesChecker = {
            metrics: {
                cssMobileFirst: notMobileFirstCount,
                cssBreakpoints: Object.keys(breakpointsOffenders).length
            },
            offenders: {
                cssMobileFirst: notMobileFirstOffenders,
                cssBreakpoints: breakpointsOffenders
            }
        };

        debug('End of media queries check');

        return data;
    };

    this.parseAllMediaQueries = function(offenders) {
        return offenders.map(this.parseOneMediaQuery);
    };

    this.parseOneMediaQuery = function(offender) {
        var splittedOffender = offendersHelpers.cssOffenderPattern(offender);
        var parts = /^@media (.*) \((\d+ rules)\)$/.exec(splittedOffender.css);

        if (!parts) {
            debug('Failed to parse media query ' + offender);
            return false;
        }

        var rulesCount = parseInt(parts[2], 10);
        var query = parts[1];

        var isForMobile = false;
        var breakpoints = [];

        try {

            var ast = parseMediaQuery(query);

            var min = 0;
            var max = Infinity;
            var pixels;

            ast.forEach(function(astItem) {
                astItem.expressions.forEach(function(expression) {
                    if (expression.feature === 'width' || expression.feature === 'device-width') {
                        if (astItem.inverse === false) {
                            if (expression.modifier === 'max') {
                                pixels = toPixels(expression.value);
                                max = Math.min(max, pixels);
                                breakpoints.push({
                                    string: expression.value,
                                    pixels: pixels
                                });
                            } else if (expression.modifier === 'min') {
                                pixels = toPixels(expression.value);
                                min = Math.max(min, pixels);
                                breakpoints.push({
                                    string: expression.value,
                                    pixels: pixels
                                });
                            }
                        } else if (astItem.inverse === true) {
                            if (expression.modifier === 'max') {
                                pixels = toPixels(expression.value);
                                min = Math.max(min, pixels);
                                breakpoints.push({
                                    string: expression.value,
                                    pixels: pixels
                                });
                            } else if (expression.modifier === 'min') {
                                pixels = toPixels(expression.value);
                                max = Math.min(max, pixels);
                                breakpoints.push({
                                    string: expression.value,
                                    pixels: pixels
                                });
                            }
                        }
                    }
                });
            });

            isForMobile = (min <= MOBILE_MIN_BREAKPOINT && max >= MOBILE_MAX_BREAKPOINT && max !== Infinity);

        } catch(error) {
            debug('Failed to parse media query ' + offender);
        }

        return {
            mediaQuery: {
                query: query,
                rules: rulesCount,
                file: splittedOffender.file,
                line: splittedOffender.line,
                column: splittedOffender.column
            },
            isForMobile: isForMobile,
            breakpoints: breakpoints
        };
    };

    // Parses a size in em, pt (or px) and returns it in px
    function toPixels(size) {
        var splittedSize = /^([\d\.]+)(.*)/.exec(size);
        var value = parseFloat(splittedSize[1]);
        var unit = splittedSize[2];

        if (unit === 'em') {
            return value * 16;
        }

        if (unit === 'pt') {
            return value / 12 * 16;
        }

        return value;
    }
};

module.exports = new mediaQueriesChecker();