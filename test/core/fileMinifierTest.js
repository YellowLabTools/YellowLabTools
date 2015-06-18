var should = require('chai').should();
var fileMinifier = require('../../lib/tools/weightChecker/fileMinifier');
var fs = require('fs');
var path = require('path');

describe('fileMinifier', function() {
    
    it('should minify a JS file with minifyJs', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/unminified-script.js'));

        var fileSize = fileContent.length;

        fileMinifier.minifyJs(fileContent.toString()).then(function(newFile) {
            var newFileSize = newFile.length;
            newFileSize.should.be.below(fileSize);
            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should minify a JS file with minifyFile', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/unminified-script.js'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/unminified-script.js',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isJS: true,
            type: 'js',
            contentLength: 999,
            weightCheck: {
                body: fileContent.toString('utf8'),
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        fileMinifier.minifyFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('isOptimized').that.equals(false);
            newEntry.weightCheck.should.have.a.property('optimized').that.is.below(fileSize);
            newEntry.weightCheck.should.have.a.property('bodyAfterOptimization').that.is.a('string');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should fail minifying an already minified JS', function(done) {
        this.timeout(5000);

        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/jquery1.8.3.js'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/jquery1.8.3.js',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isJS: true,
            type: 'js',
            contentLength: 999,
            weightCheck: {
                body: fileContent.toString('utf8'),
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        fileMinifier.minifyFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('isOptimized');
            newEntry.weightCheck.should.not.have.a.property('optimized');
            newEntry.weightCheck.should.not.have.a.property('bodyAfterOptimization');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should fail minifying a JS with syntax errors', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/svg-image.svg'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/svg-image.svg',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isJS: true,
            type: 'js',
            contentLength: 999,
            weightCheck: {
                body: fileContent.toString('utf8'),
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        fileMinifier.minifyFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('isOptimized');
            newEntry.weightCheck.should.not.have.a.property('optimized');
            newEntry.weightCheck.should.not.have.a.property('bodyAfterOptimization');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should minify a CSS file with clean-css', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/unminified-stylesheet.css'));

        var fileSize = fileContent.length;

        fileMinifier.minifyCss(fileContent.toString()).then(function(newFile) {
            var newFileSize = newFile.length;
            newFileSize.should.be.below(fileSize);
            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should minify a CSS file with minifyFile', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/unminified-stylesheet.css'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/unminified-stylesheet.css',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isCSS: true,
            type: 'css',
            contentLength: 999,
            weightCheck: {
                body: fileContent.toString('utf8'),
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize
            }
        };

        fileMinifier.minifyFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('isOptimized').that.equals(false);
            newEntry.weightCheck.should.have.a.property('optimized').that.is.below(fileSize);
            newEntry.weightCheck.should.have.a.property('bodyAfterOptimization').that.is.a('string');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should minify an HTML file with ', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/jquery-page.html'));

        var fileSize = fileContent.length;

        fileMinifier.minifyHtml(fileContent.toString()).then(function(newFile) {
            var newFileSize = newFile.length;
            newFileSize.should.be.below(fileSize);
            done();
        }).fail(function(err) {
            done(err);
        });
    });

});
