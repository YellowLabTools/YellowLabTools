var debug           = require('debug')('ylt:brotliCompressor');

var Q               = require('q');
var brotli          = require('brotli');

var gzipCompressor  = require('./gzipCompressor');


var GzipCompressor = function() {

    var BROTLI_COMPRESSION_LEVEL = 9;

    function compressFile(entry) {
        debug('Entering brotli compressor');
        return brotlifyFile(entry)

        .then(brotliOptimizedFile);
    }

    // Compress with Brotli files that were not compressed or not with brotli (with gzip or deflate)
    function brotlifyFile(entry) {
        var deferred = Q.defer();

        if (gzipCompressor.entryTypeCanBeCompressed(entry) && entry.weightCheck && entry.weightCheck.bodyBuffer) {

            if (!entry.weightCheck.isCompressed) {
                debug('File %s was not compressed at all, trying Brotli over it.', entry.url);
            } else if (entry.weightCheck.compressionTool !== 'brotli') {
                debug('File %s was compressed with %s. Trying with Brotli.', entry.url, entry.weightCheck.compressionTool);
            }

            try {
                
                var buffer = brotli.compress(entry.weightCheck.bodyBuffer, {
                    mode: 0,
                    quality: 9
                });

                if (buffer) {
                    var compressedSize = buffer.length;

                    if (!entry.weightCheck.isCompressed) {
                        debug('Brotli size is %d, was %d, this is %d% better.', compressedSize, entry.weightCheck.bodySize, Math.round((entry.weightCheck.bodySize - compressedSize) * 100 / entry.weightCheck.bodySize));
                    } else if (entry.weightCheck.compressionTool !== 'brotli') {
                        debug('Brotli size is %d, was %d with %s, this is %d% better.', compressedSize, entry.weightCheck.bodySize, entry.weightCheck.compressionTool, Math.round((entry.weightCheck.bodySize - compressedSize) * 100 / entry.weightCheck.bodySize));
                    }

                    entry.weightCheck.afterBrotliCompression = compressedSize;

                } else {
                    debug('Failed to brotlify %s', entry.url);                    
                }

                deferred.resolve(entry);

            } catch (err) {
                debug(err);
                deferred.reject(err);
            }
        } else {
            debug('Compression not needed');
            deferred.resolve(entry);
        }

        return deferred.promise;
    }

    // Gzip a file after minification or optimization if this step was successful
    function brotliOptimizedFile(entry) {
        var deferred = Q.defer();

        if (gzipCompressor.entryTypeCanBeCompressed(entry) && entry.weightCheck && entry.weightCheck.isOptimized === false) {
            debug('Trying to brotlify file after minification: %s', entry.url);

            var uncompressedSize = entry.weightCheck.optimized;

            try {

                var buffer = brotli.compress(entry.weightCheck.bodyAfterOptimization, {
                    mode: 1,
                    quality: BROTLI_COMPRESSION_LEVEL
                });

                if (buffer) {
                    var compressedSize = buffer.length;

                    debug('Correctly brotlified the minified file, was %d and is now %d bytes', uncompressedSize, compressedSize);

                    entry.weightCheck.afterOptimizationAndBrotliCompression = compressedSize;

                } else {
                    debug('Failed to brotlify %s', entry.url);                    
                }

                deferred.resolve(entry);

            } catch (err) {
                debug(err);
                deferred.reject(err);
            }

        } else {
            debug('Compressing optimized file not needed');
            deferred.resolve(entry);
        }

        return deferred.promise;
    }

    return {
        compressFile: compressFile
    };
};

module.exports = new GzipCompressor();