var debug   = require('debug')('ylt:colorDiff');
var diff    = require('color-diff');
var parse   = require('parse-color');


var colorDiff = function() {

    var COLOR_DIFF_THRESHOLD = 0.9;

    this.compareAllColors = function(data) {
        debug('Starting to compare all colors...');

        var offenders = data.toolsResults.phantomas.offenders.cssColors;
        var colors = (offenders) ? this.parseAllColors(offenders) : [];
        var result = [];

        // Compare colors to each other
        for (var i = 0; i < colors.length - 1 ; i++) {
            for (var j = i + 1; j < colors.length; j++) {
                debug('Comparing color %s with color %s', colors[i].original, colors[j].original);
                if (this.compareTwoColors(colors[i], colors[j])) {
                    debug('Colors are similar!');
                    result.push({
                        color1: colors[i].original,
                        color2: colors[j].original,
                        isDark: (colors[i].Lab.L < 60)
                    });
                }
            }
        }

        data.toolsResults.colorDiff = {
            metrics: {
                similarColors: result.length
            },
            offenders: {
                similarColors: result
            }
        };

        return data;
    };

    this.parseAllColors = function(offenders) {
        var parsedOffenders = offenders.map(this.parseOffender);
        var deduplicatedColors = {};

        parsedOffenders.forEach(function(color) {
            if (color !== null) {
                deduplicatedColors[color] = color;
            }
        });

        return Object.keys(deduplicatedColors).map(this.parseColor);
    };

    this.parseOffender = function(offender) {
        var regexResult = /^(.*) \(\d+ times\)$/.exec(offender);
        return regexResult ? regexResult[1] : null;
    };

    this.parseColor = function(color) {
        var colorArray = parse(color).rgba;

        var obj = {
            R: colorArray[0],
            G: colorArray[1],
            B: colorArray[2],
            A: colorArray[3]
        };

        obj.Lab = diff.rgb_to_lab(obj);
        obj.original = color;

        return obj;
    };

    this.compareTwoColors = function(color1, color2) {
        if (color1.A !== color2.A) {
            debug('Comparison not possible, because the alpha channel is different');
            return false;
        }

        var delta = diff.diff(color1.Lab, color2.Lab);
        debug('Delta is %d', delta);
        
        return delta <= COLOR_DIFF_THRESHOLD;
    };

};

module.exports = new colorDiff();