var should = require('chai').should();
var weightChecker = require('../../lib/tools/weightChecker/weightChecker');
var fs = require('fs');
var path = require('path');

describe('weightChecker', function() {
    
    it('should download a list of files', function(done) {
        var requestsList = [
            {
                method: 'GET',
                url: 'http://localhost:8388/simple-page.html',
                requestHeaders: {
                    'User-Agent': 'something',
                   Referer: 'http://www.google.fr/',
                   Accept: '*/*'
                },
                status: 200,
                isHTML: true,
                type: 'html'
            },
            {
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
            },
            {
                method: 'GET',
                url: 'http://localhost:8388/jpeg-image.jpg',
                requestHeaders: {
                    'User-Agent': 'something',
                   Referer: 'http://www.google.fr/',
                   Accept: '*/*'
                },
                status: 200,
                isImage: true,
                type: 'image',
                contentType: 'image/jpeg'
            },
            {
                method: 'GET',
                url: 'http://localhost:8388/svg-image.svg',
                requestHeaders: {
                    'User-Agent': 'something',
                   Referer: 'http://www.google.fr/',
                   Accept: '*/*'
                },
                status: 200,
                isImage: true,
                type: 'image',
                contentType: 'image/svg+xml'
            },
            {
                method: 'GET',
                url: 'http://localhost:8388/unminified-script.js',
                requestHeaders: {
                    'User-Agent': 'something',
                   Referer: 'http://www.google.fr/',
                   Accept: '*/*'
                },
                status: 200,
                isJS: true,
                type: 'js'
            },
            {
                method: 'GET',
                url: 'http://localhost:8388/unminified-stylesheet.css',
                requestHeaders: {
                    'User-Agent': 'something',
                   Referer: 'http://www.google.fr/',
                   Accept: '*/*'
                },
                status: 200,
                isCSS: true,
                type: 'css'
            },
            {
                method: 'GET',
                url: 'about:blank',
                requestHeaders: {
                    'User-Agent': 'something',
                   Referer: 'http://www.google.fr/',
                   Accept: '*/*'
                },
                status: 200
            }
        ];

        var data = {
            toolsResults: {
                phantomas: {
                    metrics: {
                        requestsList: true
                    },
                    offenders: {
                        requestsList: JSON.stringify(requestsList)
                    }
                }
            }
        };

        weightChecker.recheckAllFiles(data)

        .then(function(data) {
            data.toolsResults.should.have.a.property('weightChecker');
            data.toolsResults.weightChecker.should.have.a.property('metrics');
            data.toolsResults.weightChecker.should.have.a.property('offenders');

            data.toolsResults.weightChecker.offenders.should.have.a.property('totalWeight');
            data.toolsResults.weightChecker.offenders.totalWeight.totalWeight.should.be.above(0);
            data.toolsResults.weightChecker.offenders.totalWeight.byType.html.requests.length.should.equal(1);
            data.toolsResults.weightChecker.offenders.totalWeight.byType.js.requests.length.should.equal(2);
            data.toolsResults.weightChecker.offenders.totalWeight.byType.css.requests.length.should.equal(1);
            data.toolsResults.weightChecker.offenders.totalWeight.byType.image.requests.length.should.equal(2);
            data.toolsResults.weightChecker.offenders.totalWeight.byType.other.requests.length.should.equal(0);

            data.toolsResults.weightChecker.offenders.should.have.a.property('imageOptimization');
            data.toolsResults.weightChecker.offenders.imageOptimization.totalGain.should.be.above(0);
            data.toolsResults.weightChecker.offenders.imageOptimization.images.length.should.equal(2);

            data.toolsResults.weightChecker.offenders.should.have.a.property('fileMinification');
            data.toolsResults.weightChecker.offenders.fileMinification.totalGain.should.be.above(0);
            data.toolsResults.weightChecker.offenders.fileMinification.files.length.should.equal(2);

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
            isJS: true
        };

        weightChecker.redownloadEntry(entry)

        .then(function(newEntry) {

            newEntry.weightCheck.bodySize.should.equal(93636);
            newEntry.weightCheck.uncompressedSize.should.equal(newEntry.weightCheck.bodySize);
            newEntry.weightCheck.isCompressed.should.equal(false);
            newEntry.weightCheck.headersSize.should.be.above(200).and.below(400);
            newEntry.weightCheck.body.toString().should.have.string('1.8.3');

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

        weightChecker.redownloadEntry(entry)

        .then(function(newEntry) {

            newEntry.weightCheck.bodySize.should.equal(4193);
            newEntry.weightCheck.body.should.equal(fileContent.toString('binary'));

            // Opening the image in lwip to check if the format is good
            var lwip = require('lwip');
            var buffer = new Buffer(newEntry.weightCheck.body, 'binary');
            lwip.open(buffer, 'png', function(err, image) {
                image.width().should.equal(620);
                image.height().should.equal(104);
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

        weightChecker.redownloadEntry(entry)

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
            contentLength: 999
        };

        weightChecker.redownloadEntry(entry)

        .then(function(newEntry) {
            newEntry.should.not.have.a.property('weightCheck');
            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should listRequestWeight', function() {
        var totalWeightObj = weightChecker.listRequestWeight([{
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
                body: 'blabla',
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
        var totalWeightObj = weightChecker.listRequestWeight([{
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
