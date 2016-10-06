var should = require('chai').should();
var gzipCompressor = require('../../lib/tools/redownload/gzipCompressor');
var fileMinifier = require('../../lib/tools/redownload/fileMinifier');
var fs = require('fs');
var path = require('path');

describe('gzipCompressor', function() {

    var minifiedJSContent = fs.readFileSync(path.resolve(__dirname, '../www/minified-script.js'));
    var notMinifiedJSContent = fs.readFileSync(path.resolve(__dirname, '../www/unminified-script.js'));
    var someTextFileContent = fs.readFileSync(path.resolve(__dirname, '../www/svg-image.svg'));

    
    it('should gzip a JS file that was not gziped but was minified', function(done) {
        var fileContent = minifiedJSContent;
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/minified-script.js',
            status: 200,
            isJS: true,
            type: 'js',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should gzip a JS file that was not gziped and not minified', function(done) {
        /*jshint expr: true*/

        var fileContent = notMinifiedJSContent;
        var minifiedContent = minifiedJSContent;

        var fileSize = fileContent.length;
        var minifiedSize = minifiedContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/unminified-script.js',
            status: 200,
            isJS: true,
            type: 'js',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                bodyAfterOptimization: minifiedContent.toString('utf8'),
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: false,
                optimized: minifiedSize
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.have.a.property('afterOptimizationAndCompression').that.is.not.undefined;
            newEntry.weightCheck.should.have.a.property('afterOptimizationAndCompression').that.is.below(newEntry.weightCheck.afterCompression);

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should gzip a JS file that is gziped but not minified', function(done) {
        /*jshint expr: true*/

        var fileContent = notMinifiedJSContent;
        var minifiedContent = minifiedJSContent;
        var fileSize = 6436;
        var gzipedSize = 2646;
        var minifiedSize = 1954;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/unminified-script.js',
            status: 200,
            isJS: true,
            type: 'js',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                bodyAfterOptimization: minifiedContent.toString('utf8'),
                totalWeight: gzipedSize + 200,
                headersSize: 200,
                bodySize: gzipedSize,
                isCompressed: true,
                uncompressedSize: fileSize,
                isOptimized: false,
                optimized: minifiedSize
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterOptimizationAndCompression').that.is.not.undefined;
            newEntry.weightCheck.should.have.a.property('afterOptimizationAndCompression').that.is.below(gzipedSize);
            newEntry.weightCheck.should.have.a.property('afterOptimizationAndCompression').that.is.below(minifiedSize);

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should not gzip a JS file that was gziped and minified', function(done) {
        /*jshint expr: true*/

        var fileContent = notMinifiedJSContent;
        var fileSize = 6436;
        var gzipedSize = 2646;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/unminified-script.js',
            status: 200,
            isJS: true,
            type: 'js',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: gzipedSize + 200,
                headersSize: 200,
                bodySize: gzipedSize,
                isCompressed: true,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('minified');
            newEntry.weightCheck.should.not.have.a.property('bodyAfterOptimization');
            newEntry.weightCheck.should.not.have.a.property('afterCompression');
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should gzip a CSS file', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/unminified-stylesheet.css'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/unminified-stylesheet.css',
            status: 200,
            isCSS: true,
            type: 'css',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should gzip an HTML file', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/jquery-page.html'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/jquery-page.html',
            status: 200,
            isHTML: true,
            type: 'html',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should gzip an SVG file', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/svg-image.svg'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/svg-image.svg',
            status: 200,
            isImage: true,
            isSVG: true,
            type: 'image',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should gzip an XML file', function(done) {
        var fileContent = someTextFileContent; // it dosn't matter if it's not the correct file type
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/someTextFile.xml',
            status: 200,
            isXML: true,
            type: 'xml',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should gzip a JSON file', function(done) {
        var fileContent = someTextFileContent; // it dosn't matter if it's not the correct file type
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/someTextFile.json',
            status: 200,
            isJSON: true,
            type: 'json',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should gzip a TTF file', function(done) {
        var fileContent = someTextFileContent; // it dosn't matter if it's not the correct file type
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/someTextFile.ttf',
            status: 200,
            isWebFont: true,
            isTTF: true,
            type: 'webfont',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });


    it('should gzip a favicon file', function(done) {
        var fileContent = someTextFileContent; // it dosn't matter if it's not the correct file type
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/someTextFile.ico',
            status: 200,
            isFavicon: true,
            type: 'favicon',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.have.a.property('afterCompression').that.is.below(fileSize);
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should not gzip a JPEG file', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/jpeg-image.jpg'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/jpeg-image.jpg',
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/jpeg',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('afterCompression');
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });


    it('should not gzip a PNG file', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/png-image.png'));
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/png-image.png',
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/png',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('afterCompression');
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should not gzip a GIF file', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/png-image.png')); // Fake gif, don't tell anyone...
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/gif-image.gif',
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/gif',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('afterCompression');
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should not gzip a WEBP file', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/png-image.png')); // Fake webp, don't tell anyone...
        var fileSize = fileContent.length;

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/webp-image.webp',
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/webp',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: fileSize + 200,
                headersSize: 200,
                bodySize: fileSize,
                isCompressed: false,
                uncompressedSize: fileSize,
                isOptimized: true
            }
        };

        gzipCompressor.compressFile(entry)

        .then(function(newEntry) {
            newEntry.weightCheck.should.not.have.a.property('afterCompression');
            newEntry.weightCheck.should.not.have.a.property('afterOptimizationAndCompression');

            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

});
