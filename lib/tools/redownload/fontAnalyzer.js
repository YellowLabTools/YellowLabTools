var debug = require('debug')('ylt:fontAnalyzer');

var Q           = require('q');
var fontkit     = require('fontkit');
var woffTools   = require('woff-tools');
var ttf2woff2   = require('ttf2woff2');

var FontAnalyzer = function() {

    function analyzeFont(entry, charsListOnPage) {
        var deferred = Q.defer();
        
        if (!entry.weightCheck || !entry.weightCheck.bodyBuffer) {
            // No valid file available
            deferred.resolve(entry);
            return deferred.promise;
        }

        var fileSize = entry.weightCheck.bodySize;
        var ttf;
        var woff2;
        var newFileSize;

        if (entry.isWebFont) {
            debug('File %s is a font. Let\'s have a look inside!', entry.url);
            
            convertToWoff2(entry)

            .then(function(entry) {
                return getMetricsFromFont(entry, charsListOnPage);
            })

            .then(function(fontMetrics) {
                entry.fontMetrics = fontMetrics;
            })

            .fail(function(error) {
                debug('Could not open the font: %s', error);
            });

        }

        deferred.resolve(entry);
        
        return deferred.promise;
    }

    function convertToWoff2(entry) {
        var deferred = Q.defer();

        debug('Entering font format converter...');

        if (entry.isWoff2) {

            debug('File is already a woff2.');
            deferred.resolve(entry);

        } else if (entry.isWoff) {

            debug('File is a woff. Let\'s convert to woff2');

            try {

                debug('Current file size is %d', fileSize);

                ttf = woffTools.toSfnt(entry.weightCheck.bodyBuffer);
                woff2 = ttf2woff2(ttf);
                newFileSize = woff2.length;

                debug('New image size is %d', newFileSize);
                debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                entry.weightCheck.sizeAsWoff2 = newFileSize;

                deferred.resolve(entry);

            } catch(error) {
                deferred.reject(error);
            }

        } else if (entry.isTtf) {

            debug('File is a TTF. Let\'s convert to woff2');

            try {

                debug('Current file size is %d', fileSize);

                woff2 = ttf2woff2(entry.weightCheck.bodyBuffer);
                newFileSize = woff2.length;

                debug('New image size is %d', newFileSize);
                debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                entry.weightCheck.sizeAsWoff2 = newFileSize;

                deferred.resolve(entry);

            } catch(error) {
                deferred.reject(error);
            }

        } else {
            // Other font formats are not handled
            deferred.resolve(entry);
        }

        return deferred.promise;
    }

    // The gain is estimated of enough value if it's over 1KB or over 20%,
    // but it's ignored if is below 100 bytes
    function gainIsEnough(oldWeight, newWeight) {
        var gain = oldWeight - newWeight;
        var ratio = gain / oldWeight;
        return (gain > 2048 || (ratio > 0.2 && gain > 100));
    }

    function getMetricsFromFont(entry, charsListOnPage) {
        var deferred = Q.defer();
        
        try {
            var startTime = Date.now();
            var font = fontkit.create(entry.weightCheck.bodyBuffer);

            var result = {
                name: font.fullName || font.postscriptName || font.familyName,
                numGlyphs: font.numGlyphs,
                averageGlyphComplexity: getAverageGlyphComplexity(font),
                compressedWeight: entry.weightCheck.afterCompression || entry.weightCheck.bodySize,
                unicodeRanges: readUnicodeRanges(font.characterSet, charsListOnPage),
                numGlyphsInCommonWithPageContent: countPossiblyUsedGlyphs(getCharacterSetAsString(font.characterSet), charsListOnPage)
            };

            var endTime = Date.now();
            debug('Font analysis took %dms', endTime - startTime);

            // Mark fonts that are not used on the page (#224)
            var fontIsUsed = false;
            for (var range in result.unicodeRanges) {
                if (result.unicodeRanges[range].numGlyphsInCommonWithPageContent > 0) {
                    fontIsUsed = true;
                    break;
                }
            }
            result.isUsed = fontIsUsed;

            deferred.resolve(result);
        } catch(error) {
            deferred.reject(error);
        }

        return deferred.promise;
    }

    // Reads the number of vector commands (complexity) needed to render glyphs and
    // returns the average. Only first 100 glyphes are tested, otherwise it would take tool long;
    function getAverageGlyphComplexity(font) {
        var max = Math.min(font.numGlyphs, 100);

        var totalPathsCommands = 0;
        for (var i = 0; i < max; i++) {
            totalPathsCommands += font.getGlyph(i).path.commands.length;
        }
        return Math.round(totalPathsCommands / max * 10) / 10;
    }

    function readUnicodeRanges(charsetInFont, charsListOnPage) {
        var ranges = {};

        // Assign a range to each char found in the font
        charsetInFont.forEach(function(char) {
            
            var currentRange = getUnicodeRangeFromChar(char);
            var currentRangeName = currentRange.name;

            if (!ranges[currentRangeName]) {
                // Cloning the object
                ranges[currentRangeName] = Object.assign({}, currentRange);
            }

            if (!ranges[currentRangeName].charset) {
                ranges[currentRangeName].charset = '';
            }

            ranges[currentRangeName].charset += String.fromCharCode(char);
        });

        var range;
        var expectedLength;
        var actualLength;

        for (var rangeName in ranges) {
            /*jshint loopfunc: true */

            range = ranges[rangeName];

            // Estimate if range is used, based on the characters found in the page
            range.numGlyphsInCommonWithPageContent = countPossiblyUsedGlyphs(range.charset, charsListOnPage);

            // Calculate coverage
            if (rangeName !== 'Others') {
                expectedLength = range.rangeEnd - range.rangeStart + 1;
                actualLength = range.charset.length;
                range.coverage = Math.min(actualLength / expectedLength, 1);
            }
        }

        return ranges;
    }

    function countPossiblyUsedGlyphs(charsetInFont, charsListOnPage) {
        var count = 0;
        charsListOnPage.split('').forEach(function(char) {
            if (charsetInFont.indexOf(char) >= 0) {
                count ++;
            }
        });
        return count;
    }

    function getCharacterSetAsString(characterSet) {
        var str = '';
        characterSet.forEach(function(charCode) {
            str += String.fromCharCode(charCode);
        });
        return str;
    }

    function getUnicodeRangeFromChar(char) {
        return UNICODE_RANGES.find(function(range) {
            return (char >= range.rangeStart && char <= range.rangeEnd);
        }) || {name: 'Others'};
    }


    var UNICODE_RANGES = [
        {
            name: 'Basic Latin',
            rangeStart: 0x0020,
            rangeEnd: 0x007F
        },
        {
            name: 'Latin-1 Supplement',
            rangeStart: 0x00A0,
            rangeEnd: 0x00FF
        },
        {
            name: 'Latin Extended',
            rangeStart: 0x0100,
            rangeEnd: 0x024F
        },
        {
            name: 'IPA Extensions',
            rangeStart: 0x0250,
            rangeEnd: 0x02AF
        },
        {
            name: 'Greek and Coptic',
            rangeStart: 0x0370,
            rangeEnd: 0x03FF
        },
        {
            name: 'Cyrillic',
            rangeStart: 0x0400,
            rangeEnd: 0x052F
        },
        {
            name: 'Armenian',
            rangeStart: 0x0530,
            rangeEnd: 0x058F
        },
        {
            name: 'Hebrew',
            rangeStart: 0x0590,
            rangeEnd: 0x05FF
        },
        {
            name: 'Arabic',
            rangeStart: 0x0600,
            rangeEnd: 0x06FF
        },
        {
            name: 'Syriac',
            rangeStart: 0x0700,
            rangeEnd: 0x074F
        },
        {
            name: 'Thaana',
            rangeStart: 0x0780,
            rangeEnd: 0x07BF
        },
        {
            name: 'Devanagari',
            rangeStart: 0x0900,
            rangeEnd: 0x097F
        },
        {
            name: 'Bengali',
            rangeStart: 0x0980,
            rangeEnd: 0x09FF
        },
        {
            name: 'Gurmukhi',
            rangeStart: 0x0A00,
            rangeEnd: 0x0A7F
        },
        {
            name: 'Gujarati',
            rangeStart: 0x0A80,
            rangeEnd: 0x0AFF
        },
        {
            name: 'Oriya',
            rangeStart: 0x0B00,
            rangeEnd: 0x0B7F
        },
        {
            name: 'Tamil',
            rangeStart: 0x0B80,
            rangeEnd: 0x0BFF
        },
        {
            name: 'Telugu',
            rangeStart: 0x0C00,
            rangeEnd: 0x0C7F
        },
        {
            name: 'Kannada',
            rangeStart: 0x0C80,
            rangeEnd: 0x0CFF
        },
        {
            name: 'Malayalam',
            rangeStart: 0x0D00,
            rangeEnd: 0x0D7F
        },
        {
            name: 'Sinhala',
            rangeStart: 0x0D80,
            rangeEnd: 0x0DFF
        },
        {
            name: 'Thai',
            rangeStart: 0x0E00,
            rangeEnd: 0x0E7F
        },
        {
            name: 'Lao',
            rangeStart: 0x0E80,
            rangeEnd: 0x0EFF
        },
        {
            name: 'Tibetan',
            rangeStart: 0x0F00,
            rangeEnd: 0x0FFF
        },
        {
            name: 'Myanmar',
            rangeStart: 0x1000,
            rangeEnd: 0x109F
        },
        {
            name: 'Georgian',
            rangeStart: 0x10A0,
            rangeEnd: 0x10FF
        },
        {
            name: 'Hangul Jamo',
            rangeStart: 0x1100,
            rangeEnd: 0x11FF
        },
        {
            name: 'Ethiopic',
            rangeStart: 0x1200,
            rangeEnd: 0x137F
        },
        {
            name: 'Cherokee',
            rangeStart: 0x13A0,
            rangeEnd: 0x13FF
        },
        {
            name: 'Unified Canadian Aboriginal Syllabics',
            rangeStart: 0x1400,
            rangeEnd: 0x167F
        },
        {
            name: 'Ogham',
            rangeStart: 0x1680,
            rangeEnd: 0x169F
        },
        {
            name: 'Runic',
            rangeStart: 0x16A0,
            rangeEnd: 0x16FF
        },
        {
            name: 'Tagalog',
            rangeStart: 0x1700,
            rangeEnd: 0x171F
        },
        {
            name: 'Hanunoo',
            rangeStart: 0x1720,
            rangeEnd: 0x173F
        },
        {
            name: 'Buhid',
            rangeStart: 0x1740,
            rangeEnd: 0x175F
        },
        {
            name: 'Tagbanwa',
            rangeStart: 0x1760,
            rangeEnd: 0x177F
        },
        {
            name: 'Khmer',
            rangeStart: 0x1780,
            rangeEnd: 0x17FF
        },
        {
            name: 'Mongolian',
            rangeStart: 0x1800,
            rangeEnd: 0x18AF
        },
        {
            name: 'Limbu',
            rangeStart: 0x1900,
            rangeEnd: 0x194F
        },
        {
            name: 'Tai Le',
            rangeStart: 0x1950,
            rangeEnd: 0x197F
        },
        {
            name: 'Hiragana',
            rangeStart: 0x3040,
            rangeEnd: 0x309F
        },
        {
            name: 'Katakana',
            rangeStart: 0x30A0,
            rangeEnd: 0x30FF
        },
        {
            name: 'Bopomofo',
            rangeStart: 0x3100,
            rangeEnd: 0x312F
        }
    ];

    return {
        analyzeFont: analyzeFont,
        getMetricsFromFont: getMetricsFromFont,
        readUnicodeRanges: readUnicodeRanges,
        getAverageGlyphComplexity: getAverageGlyphComplexity,
        countPossiblyUsedGlyphs: countPossiblyUsedGlyphs,
        getCharacterSetAsString: getCharacterSetAsString,
        getUnicodeRangeFromChar: getUnicodeRangeFromChar
    };
};

module.exports = new FontAnalyzer();