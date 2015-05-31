var should = require('chai').should();
var imageOptimizer = require('../../lib/tools/weightChecker/imageOptimizer');
var fs = require('fs');
var path = require('path');

describe('imageOptimizer', function() {
    
    it('should optimize a JPEG image losslessly', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/jpeg-image.jpg'));

        var fileSize = fileContent.length;

        imageOptimizer.compressJpegLosslessly(fileContent).then(function(newFile) {
            var newFileSize = newFile.contents.length;
            newFileSize.should.be.below(fileSize);
            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should optimize a JPEG image lossly', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/jpeg-image.jpg'));

        var fileSize = fileContent.length;

        imageOptimizer.compressJpegLossly(fileContent).then(function(newFile) {
            var newFileSize = newFile.contents.length;
            newFileSize.should.be.below(fileSize);
            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should find the best optimization for a jpeg', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/jpeg-image.jpg'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/an-image.jpg',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/jpeg',
            contentLength: 999,
            weightCheck: {
                body: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        imageOptimizer.optimizeImage(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('isOptimized').that.equals(false);
            newEntry.weightCheck.should.have.a.property('lossless').that.is.below(fileSize);
            newEntry.weightCheck.should.have.a.property('lossy').that.is.below(newEntry.weightCheck.lossless);

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should optimize a PNG image losslessly', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/png-image.png'));

        var fileSize = fileContent.length;

        imageOptimizer.compressPngLosslessly(fileContent).then(function(newFile) {
            var newFileSize = newFile.contents.length;
            newFileSize.should.be.below(fileSize);
            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should optimize a png', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/png-image.png'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/an-image.png',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/png',
            contentLength: 999,
            weightCheck: {
                body: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        imageOptimizer.optimizeImage(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('isOptimized').that.equals(false);
            newEntry.weightCheck.should.have.a.property('lossless').that.is.below(fileSize);

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });


    it('should optimize an SVG image losslessly', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/svg-image.svg'));

        var fileSize = fileContent.length;

        imageOptimizer.compressSvgLosslessly(fileContent).then(function(newFile) {
            var newFileSize = newFile.contents.length;
            newFileSize.should.be.below(fileSize);
            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should optimize an SVG', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/svg-image.svg'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/an-image.svg',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/svg+xml',
            contentLength: 999,
            weightCheck: {
                body: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        imageOptimizer.optimizeImage(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('isOptimized').that.equals(false);
            newEntry.weightCheck.should.have.a.property('lossless').that.is.below(fileSize);

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });


    it('shouldn\'t fail optimizing a corrupted jpeg', function(done) {

        // In this test, we try to optimize a PNG but with a falsy "image/jpeg" content type

        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/png-image.png'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/an-image.png',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/jpeg',
            contentLength: 999,
            weightCheck: {
                body: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        imageOptimizer.optimizeImage(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('isOptimized');
            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('shouldn\'t fail optimizing a corrupted png', function(done) {

        // In this test, we try to optimize a JPEG but with a falsy "image/png" content type

        var fileContent = fs.readFileSync(path.resolve(__dirname, '../fixtures/jpeg-image.jpg'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/an-image.jpg',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/png',
            contentLength: 999,
            weightCheck: {
                body: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        imageOptimizer.optimizeImage(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('isOptimized');
            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

});
