var should = require('chai').should();
var redownload = require('../../lib/tools/redownload/redownload');
var fs = require('fs');
var path = require('path');

describe('redownload', function() {
    
    it('should download a list of files', function(done) {
        this.timeout(10000);

        var requestsList = [
            {
                url: 'http://localhost:8388/simple-page.html',
                type: 'html',
                size: 30000
            },
            {
                url: 'http://localhost:8388/jquery1.8.3.js',
                type: 'js',
                size: 30000
            },
            {
                url: 'http://localhost:8388/jpeg-image.jpg',
                type: 'image',
                size: 30000
            },
            {
                url: 'http://localhost:8388/svg-image.svg',
                type: 'image',
                size: 30000
            },
            {
                url: 'http://localhost:8388/unminified-script.js',
                type: 'js',
                size: 30000
            },
            {
                url: 'http://localhost:8388/unminified-stylesheet.css',
                type: 'css',
                size: 30000
            },
            {
                url: 'http://localhost:8388/xml.xml',
                type: 'xml',
                size: 30000
            },
            {
                url: 'about:blank'
            }
        ];

        var data = {
            params: {
                options: {
                    device: 'phone'
                }
            },
            toolsResults: {
                phantomas: {
                    metrics: {
                        requests: 8
                    },
                    offenders: {
                        requests: requestsList
                    }
                }
            }
        };

        redownload.recheckAllFiles(data)

        .then(function(data) {
            data.toolsResults.should.have.a.property('redownload');
            data.toolsResults.redownload.should.have.a.property('metrics');
            data.toolsResults.redownload.should.have.a.property('offenders');

            data.toolsResults.redownload.offenders.should.have.a.property('totalWeight');
            data.toolsResults.redownload.offenders.totalWeight.totalWeight.should.be.above(0);
            data.toolsResults.redownload.offenders.totalWeight.byType.html.requests.length.should.equal(1);
            data.toolsResults.redownload.offenders.totalWeight.byType.js.requests.length.should.equal(2);
            data.toolsResults.redownload.offenders.totalWeight.byType.css.requests.length.should.equal(1);
            data.toolsResults.redownload.offenders.totalWeight.byType.image.requests.length.should.equal(2);
            data.toolsResults.redownload.offenders.totalWeight.byType.other.requests.length.should.equal(1);

            data.toolsResults.redownload.offenders.should.have.a.property('compression');
            data.toolsResults.redownload.offenders.compression.totalGain.should.be.above(0);
            data.toolsResults.redownload.offenders.compression.files.length.should.equal(5);

            data.toolsResults.redownload.offenders.should.have.a.property('fileMinification');
            data.toolsResults.redownload.offenders.fileMinification.totalGain.should.be.above(0);
            data.toolsResults.redownload.offenders.fileMinification.files.length.should.equal(2);

            data.toolsResults.redownload.metrics.should.have.a.property('totalRequests').that.equals(7);
            data.toolsResults.redownload.offenders.should.have.a.property('totalRequests');
            data.toolsResults.redownload.offenders.totalRequests.byType.html.length.should.equal(1);
            data.toolsResults.redownload.offenders.totalRequests.byType.js.length.should.equal(2);
            data.toolsResults.redownload.offenders.totalRequests.byType.css.length.should.equal(1);
            data.toolsResults.redownload.offenders.totalRequests.byType.image.length.should.equal(2);
            data.toolsResults.redownload.offenders.totalRequests.byType.json.length.should.equal(0);
            data.toolsResults.redownload.offenders.totalRequests.byType.webfont.length.should.equal(0);
            data.toolsResults.redownload.offenders.totalRequests.byType.video.length.should.equal(0);
            data.toolsResults.redownload.offenders.totalRequests.byType.other.length.should.equal(1);

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should download a file and measure its size', function(done) {
        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/jquery1.8.3.js',
            requestHeaders: {
                'User-Agent': 'something',
               Referer: 'http://www.google.fr/',
               Accept: '*/*'
            },
            status: 200,
            isJS: true,
            type: 'js'
        };

        redownload.redownloadEntry(entry)

        .then(function(newEntry) {

            newEntry.weightCheck.bodySize.should.equal(93636);
            newEntry.weightCheck.uncompressedSize.should.equal(newEntry.weightCheck.bodySize);
            newEntry.weightCheck.isCompressed.should.equal(false);
            newEntry.weightCheck.headersSize.should.be.above(200).and.below(400);
            newEntry.weightCheck.bodyBuffer.toString().should.have.string('1.8.3');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should download a PNG image and find the same body as fs.readFile', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/logo-large.png'));

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/logo-large.png',
            requestHeaders: {
                'User-Agent': 'something',
               Referer: 'http://www.google.fr/',
               Accept: '*/*'
            },
            status: 200,
            isImage: true,
            contentType: 'image/png'
        };

        redownload.redownloadEntry(entry)

        .then(function(newEntry) {

            newEntry.weightCheck.bodySize.should.equal(4193);
            newEntry.weightCheck.bodyBuffer.should.deep.equal(fileContent);

            // Opening the image in jimp to check if the format is good
            var Jimp = require('jimp');
            Jimp.read(newEntry.weightCheck.bodyBuffer, function(err, image) {
                image.bitmap.width.should.equal(620);
                image.bitmap.height.should.equal(104);
                done(err);
            });

        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should fail downloading a file in error', function(done) {
        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/no-file',
            requestHeaders: {
                'User-Agent': 'something',
               Referer: 'http://www.google.fr/',
               Accept: '*/*'
            },
            status: 200,
            isHTML: true,
            contentLength: 999
        };

        redownload.redownloadEntry(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('message').that.equals('error while downloading: 404');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should not download a non 200 request', function(done) {
        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/no-file',
            requestHeaders: {
                'User-Agent': 'something',
               Referer: 'http://www.google.fr/',
               Accept: '*/*'
            },
            status: 302,
            isHTML: true,
            contentLength: 999,
            notFound: true
        };

        redownload.redownloadEntry(entry)

        .then(function(newEntry) {
            newEntry.should.not.have.a.property('weightCheck');
            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should listRequestWeight', function() {
        var totalWeightObj = redownload.listRequestWeight([{
            method: 'GET',
            url: 'http://localhost:8388/jquery1.8.3.js',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isHTML: true,
            type: 'html',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: 'blabla',
                headersSize: 200,
                bodySize: 500,
                isCompressed: false,
                uncompressedSize: 500
            }
        }]);

        totalWeightObj.totalWeight.should.equal(700);
        totalWeightObj.byType.html.totalWeight.should.equal(700);
        totalWeightObj.byType.html.requests.should.have.length(1);
        totalWeightObj.byType.html.requests[0].should.have.a.property('url').that.equals('http://localhost:8388/jquery1.8.3.js');
        totalWeightObj.byType.html.requests[0].should.have.a.property('weight').that.equals(700);
    });

    it('should listRequestWeight even if download failed', function() {
        var totalWeightObj = redownload.listRequestWeight([{
            method: 'GET',
            url: 'http://localhost:8388/jquery1.8.3.js',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isHTML: true,
            type: 'html',
            contentLength: 999,
            weightCheck: {
                message: 'error while downloading: 404'
            }
        }]);

        totalWeightObj.totalWeight.should.equal(999);
    });

});
