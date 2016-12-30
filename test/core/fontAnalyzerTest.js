var should = require('chai').should();
var fontAnalyzer = require('../../lib/tools/redownload/fontAnalyzer');
var fs = require('fs');
var path = require('path');

describe('fontAnalyzer', function() {
    
    it('should extract metrics from a font', function(done) {
        this.timeout(10000);

        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/SourceSansPro/SourceSansPro-Regular.woff'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/SourceSansPro/SourceSansPro-Regular.woff',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isWebFont: true,
            type: 'webfont',
            contentType: 'image/jpeg',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        fontAnalyzer.getMetricsFromFont(entry, 'ABCD')

        .then(function(metrics) {

            metrics.should.be.an('Object');
            metrics.should.have.a.property('name').that.equals('Source Sans Pro');
            metrics.should.have.a.property('numGlyphs').that.equals(1944);
            metrics.should.have.a.property('averageGlyphComplexity').that.equals(26.6);
            metrics.should.have.a.property('compressedWeight').that.equals(fileSize);

            metrics.should.have.a.property('unicodeRanges').that.is.an('Object');
            metrics.unicodeRanges.should.have.a.property('Basic Latin');
            metrics.unicodeRanges['Basic Latin'].should.have.a.property('charset').that.is.a('String');
            metrics.unicodeRanges['Basic Latin'].charset.length.should.equal(95);
            metrics.unicodeRanges['Basic Latin'].name.should.equal('Basic Latin');
            metrics.unicodeRanges['Basic Latin'].rangeStart.should.equal(0x0020);
            metrics.unicodeRanges['Basic Latin'].rangeEnd.should.equal(0x007F);
            metrics.unicodeRanges['Basic Latin'].coverage.should.equal(95 / 96);
            metrics.unicodeRanges['Basic Latin'].numGlyphsInCommonWithPageContent.should.equal(4);

            metrics.unicodeRanges.Cyrillic.numGlyphsInCommonWithPageContent.should.equal(0);

            metrics.should.have.a.property('numGlyphsInCommonWithPageContent').that.equals(4);

            should.equal(metrics.unicodeRanges.Others.coverage, undefined);

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should sort glyphes by unicode ranges', function() {
        var ranges = fontAnalyzer.readUnicodeRanges([0x0041, 0x0042, 0x0043, 0x0044, 0x0416], '0123AMZ');
        
        ranges.should.deep.equal({ 
            'Basic Latin': {
                name: 'Basic Latin',
                rangeStart: 32,
                rangeEnd: 127,
                charset: 'ABCD',
                coverage: 0.041666666666666664,
                numGlyphsInCommonWithPageContent: 1
            },
            'Cyrillic': {
                name: 'Cyrillic',
                rangeStart: 1024,
                rangeEnd: 1327,
                charset: 'Ж',
                coverage: 0.003289473684210526,
                numGlyphsInCommonWithPageContent: 0
            }
        });
    });

    it('should transform an array of char codes into a string', function() {
        var str = fontAnalyzer.getCharacterSetAsString([0x0041, 0x0042, 0x0043, 0x0044, 0x0416]);
        str.should.equal('ABCDЖ');
    });

    it('should find the right unicode range for a char', function() {
        fontAnalyzer.getUnicodeRangeFromChar(0x0020).should.deep.equal({
            name: 'Basic Latin',
            rangeStart: 0x0020,
            rangeEnd: 0x007F
        });

        fontAnalyzer.getUnicodeRangeFromChar(0x0021).name.should.equal('Basic Latin');
        fontAnalyzer.getUnicodeRangeFromChar(0x007F).name.should.equal('Basic Latin');
        fontAnalyzer.getUnicodeRangeFromChar(0x007E).name.should.equal('Basic Latin');
        fontAnalyzer.getUnicodeRangeFromChar(0x0000).name.should.equal('Others');
        fontAnalyzer.getUnicodeRangeFromChar(0xFFFFFFFFF).name.should.equal('Others');
    });

});
