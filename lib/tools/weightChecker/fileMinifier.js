var debug = require('debug')('ylt:fileMinifier');

var Q               = require('q');
var UglifyJS        = require('uglify-js');
var CleanCSS        = require('clean-css');
var Minimize        = require('minimize');


var FileMinifier = function() {

    function minifyFile(entry) {
        var deferred = Q.defer();

        if (!entry.weightCheck || !entry.weightCheck.body) {
            // No valid file available
            deferred.resolve(entry);
            return deferred.promise;
        }

        var fileSize = entry.weightCheck.uncompressedSize;
        debug('Let\'s try to optimize %s', entry.url);
        debug('Current file size is %d', fileSize);

        if (entry.isJS) {

            debug('File is a JS');

            // Starting softly with a lossless compression
            return minifyJs(entry.weightCheck.body)

            .then(function(newFile) {
                if (!newFile) {
                    debug('Optimization didn\'t work');
                    return entry;
                }

                var newFileSize = newFile.length;

                debug('JS minification complete for %s', entry.url);
                
                if (gainIsEnough(fileSize, newFileSize)) {
                    entry.weightCheck.minified = newFileSize;
                    entry.weightCheck.isMinified = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                }

                return entry;
            })

            .fail(function(err) {
                return entry;
            });

        } else if (entry.isCSS) {

            debug('File is a CSS');

            // Starting softly with a lossless compression
            return minifyCss(entry.weightCheck.body)

            .then(function(newFile) {
                if (!newFile) {
                    debug('Optimization didn\'t work');
                    return entry;
                }

                var newFileSize = newFile.length;

                debug('CSS minification complete for %s', entry.url);
                
                if (gainIsEnough(fileSize, newFileSize)) {
                    entry.weightCheck.minified = newFileSize;
                    entry.weightCheck.isMinified = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                }

                return entry;
            })

            .fail(function(err) {
                return entry;
            });

        } else if (entry.isHTML) {

            debug('File is an HTML');

            // Starting softly with a lossless compression
            return minifyHtml(entry.weightCheck.body)

            .then(function(newFile) {
                if (!newFile) {
                    debug('Optimization didn\'t work');
                    return entry;
                }

                var newFileSize = newFile.length;

                debug('HTML minification complete for %s', entry.url);
                
                if (gainIsEnough(fileSize, newFileSize)) {
                    entry.weightCheck.minified = newFileSize;
                    entry.weightCheck.isMinified = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                }

                return entry;
            })

            .fail(function(err) {
                return entry;
            });

        } else {
            debug('File type %s is not an (optimizable) image', entry.contentType);
            deferred.resolve(entry);
        }

        return deferred.promise;
    }

    // The gain is estimated of enough value if it's over 2KB or over 20%,
    // but it's ignored if is below 400 bytes
    function gainIsEnough(oldWeight, newWeight) {
        var gain = oldWeight - newWeight;
        var ratio = gain / oldWeight;
        return (gain > 2096 || (ratio > 0.2 && gain > 400));
    }

    // Uglify
    function minifyJs(body) {
        var deferred = Q.defer();

        try {
            var result = UglifyJS.minify(body, {fromString: true});
            deferred.resolve(result.code);
        } catch(err) {
            deferred.reject(err);
        }

        return deferred.promise;
    }

    // Clear-css
    function minifyCss(body) {
        var deferred = Q.defer();

        try {
            var result = new CleanCSS({compatibility: 'ie8'}).minify(body);
            deferred.resolve(result.styles);
        } catch(err) {
            deferred.reject(err);
        }

        return deferred.promise;
    }

    // HTMLMinifier
    function minifyHtml(body) {
        var deferred = Q.defer();

        var minimize = new Minimize({
            empty: true,        // KEEP empty attributes
            conditionals: true, // KEEP conditional internet explorer comments
            spare: true         // KEEP redundant attributes
        });

        minimize.parse(body, function (error, data) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(data);
            }
        });

        return deferred.promise;
    }

    return {
        minifyFile: minifyFile,
        minifyJs: minifyJs,
        minifyCss: minifyCss,
        minifyHtml: minifyHtml,
        gainIsEnough: gainIsEnough
    };
};

module.exports = new FileMinifier();