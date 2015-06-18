var debug = require('debug')('ylt:gzipCompressor');

var Q       = require('q');
var zlib    = require('zlib');

var GzipCompressor = function() {

    function compressFile(entry) {
        return gzipUncompressedFile(entry)

        .then(gzipOptimizedFile);
    }

    // Gzip a file if it was not already gziped
    function gzipUncompressedFile(entry) {
        var deferred = Q.defer();

        if (isCompressible(entry) && !entry.weightCheck.isCompressed) {
            debug('Compression missing, trying to gzip file %s', entry.url);

            var uncompressedSize = entry.weightCheck.uncompressedSize;

            zlib.gzip(new Buffer(entry.weightCheck.body, 'utf8'), function(err, buffer) {
                if (err) {
                    debug('Could not compress uncompressed file with gzip');
                    debug(err);

                    deferred.reject(err);
                } else {
                    var compressedSize = buffer.length;

                    if (gainIsEnough(uncompressedSize, compressedSize)) {
                        debug('File correctly gziped, was %d and is now %d bytes', uncompressedSize, compressedSize);

                        entry.weightCheck.afterCompression = compressedSize;
                        deferred.resolve(entry);
                    } else {
                        debug('Gain is not enough, was %d and is now %d bytes', uncompressedSize, compressedSize);
                    }
                }
            });
        } else {
            deferred.resolve(entry);
        }

        return deferred.promise;
    }

    // Gzip a file after minification or optimization if this step was successful
    function gzipOptimizedFile(entry) {
        var deferred = Q.defer();

        if (isCompressible(entry) && !entry.weightCheck.isOptimized && !entry.weightCheck.isMinified) {
            debug('Trying to gzip file after minification: %s', entry.url);

            var uncompressedSize = entry.weightCheck.optimized || entry.weightCheck.minified;

            zlib.gzip(new Buffer(entry.weightCheck.bodyAfterMinification, 'utf8'), function(err, buffer) {
                if (err) {
                    debug('Could not compress minified file with gzip');
                    debug(err);

                    deferred.reject(err);
                } else {
                    var compressedSize = buffer.length;

                    if (gainIsEnough(uncompressedSize, compressedSize)) {
                        debug('File correctly gziped, was %d and is now %d bytes', uncompressedSize, compressedSize);

                        entry.weightCheck.afterOptimizationAndCompression = compressedSize;
                        deferred.resolve(entry);
                    } else {
                        debug('Gain is not enough, was %d and is now %d bytes', uncompressedSize, compressedSize);
                    }
                }
            });
        } else {
            deferred.resolve(entry);
        }

        return deferred.promise;
    }

    function isCompressible(entry) {
        return entry.isJS || entry.isCSS || entry.isHTML || entry.isJSON || entry.isSVG || entry.isTTF || entry.isXML || entry.isFavicon;
    }

    // The gain is estimated of enough value if it's over 1KB or over 20%,
    // but it's ignored if is below 100 bytes
    function gainIsEnough(oldWeight, newWeight) {
        var gain = oldWeight - newWeight;
        var ratio = gain / oldWeight;
        return (gain > 2048 || (ratio > 0.2 && gain > 100));
    }

    return {
        compressFile: compressFile
    };
};

module.exports = new GzipCompressor();