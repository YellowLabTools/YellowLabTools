var debug = require('debug')('ylt:imageOptimizer');

var Q           = require('q');
var Imagemin    = require('imagemin');
var jpegoptim   = require('imagemin-jpegoptim');

var ImageOptimizer = function() {

    var MAX_JPEG_QUALITY = 85;

    function optimizeImage(entry) {
        var deferred = Q.defer();

        var fileSize = entry.weightCheck.body.length;
        debug('Current file size is %d', fileSize);

        if (isJpeg(entry)) {
            debug('File is a JPEG');

            // Starting softly with a lossless compression
            return compressJpegLosslessly(entry.weightCheck.body)

            .then(function(newFile) {
                var newFileSize = newFile.contents.length;

                debug('JPEG lossless compression complete for %s', entry.url);
                
                if (newFileSize < fileSize) {
                    entry.weightCheck.lossless = entry.weightCheck.optimized = newFileSize;
                    entry.weightCheck.isOptimized = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                }


                // Now let's compress lossy to MAX_JPEG_QUALITY
                return compressJpegLossly(entry.weightCheck.body);
            })
            
            .then(function(newFile) {
                var newFileSize = newFile.contents.length;

                debug('JPEG lossy compression complete for %s', entry.url);

                if (newFileSize < fileSize) {
                    entry.weightCheck.lossy = newFileSize;
                    entry.weightCheck.isOptimized = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));

                    if (newFileSize < entry.weightCheck.lossless) {
                        entry.weightCheck.optimized = newFileSize;
                    }
                }

                return entry;
            });

        } else if (isPNG(entry)) {

            debug('File is a PNG');

            // Starting softly with a lossless compression
            return compressPngLosslessly(entry.weightCheck.body)

            .then(function(newFile) {
                var newFileSize = newFile.contents.length;

                debug('PNG lossless compression complete for %s', entry.url);
                
                if (newFileSize < fileSize) {
                    entry.weightCheck.lossless = entry.weightCheck.optimized = newFileSize;
                    entry.weightCheck.isOptimized = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                }

                return entry;
            });

        } else {
            debug('File type is not an optimizable image');
            deferred.resolve(entry);
        }

        return deferred.promise;
    }

    function isJpeg(entry) {
        return entry.isImage && entry.contentType === 'image/jpeg';
    }

    function compressJpegLosslessly(imageBody) {
        var deferred = Q.defer();
        var startTime = Date.now();

        debug('Starting JPEG lossless compression');

        new Imagemin()
            .src(imageBody)
            .use(Imagemin.jpegtran())
            .run(function (err, files) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(files[0]);
                    var endTime = Date.now();
                    debug('compressJpegLosslessly took %d ms', endTime - startTime);
                }
            });

        return deferred.promise;
    }

    function compressJpegLossly(imageBody) {
        var deferred = Q.defer();
        var startTime = Date.now();

        debug('Starting JPEG lossy compression');

        new Imagemin()
            .src(imageBody)
            .use(jpegoptim({max: MAX_JPEG_QUALITY}))
            .run(function (err, files) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(files[0]);
                    var endTime = Date.now();
                    debug('compressJpegLossly took %d ms', endTime - startTime);
                }
            });

        return deferred.promise;
    }

    function isPNG(entry) {
        return entry.isImage && entry.contentType === 'image/png';
    }

    function compressPngLosslessly(imageBody) {
        var deferred = Q.defer();
        var startTime = Date.now();

        debug('Starting PNG losslessly compression');

        new Imagemin()
            .src(imageBody)
            .use(Imagemin.optipng({optimizationLevel: 2}))
            .run(function (err, files) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(files[0]);
                    var endTime = Date.now();
                    debug('compressPngLosslessly took %d ms', endTime - startTime);
                }
            });

        return deferred.promise;
    }

    return {
        //recompressIfImage: recompressIfImage,
        optimizeImage: optimizeImage,
        compressJpegLosslessly: compressJpegLosslessly,
        compressJpegLossly: compressJpegLossly,
        compressPngLosslessly: compressPngLosslessly
    };
};

module.exports = new ImageOptimizer();