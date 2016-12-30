var debug = require('debug')('ylt:fileMinifier');

var Q               = require('q');
var UglifyJS        = require('uglify-js');
var CleanCSS        = require('clean-css');
var Minimize        = require('minimize');


var FileMinifier = function() {

    function minifyFile(entry) {
        var deferred = Q.defer();

        if (!entry.weightCheck || !entry.weightCheck.bodyBuffer) {
            // No valid file available
            deferred.resolve(entry);
            return deferred.promise;
        }

        var fileSize = entry.weightCheck.uncompressedSize;
        var bodyString = entry.weightCheck.bodyBuffer.toString();

        debug('Let\'s try to optimize %s', entry.url);
        debug('Current file size is %d', fileSize);
        var startTime = Date.now();

        if (entry.isJS && !isKnownAsMinified(entry.url) && !looksAlreadyMinified(bodyString)) {

            debug('File is a JS');

            return minifyJs(bodyString)

            .then(function(newFile) {
                if (!newFile) {
                    debug('Optimization didn\'t work');
                    return entry;
                }

                var endTime = Date.now();

                var newFileSize = newFile.length;

                debug('JS minification complete for %s', entry.url);
                
                if (gainIsEnough(fileSize, newFileSize)) {
                    entry.weightCheck.bodyAfterOptimization = newFile;
                    entry.weightCheck.optimized = newFileSize;
                    entry.weightCheck.isOptimized = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                }

                return entry;
            })

            .fail(function(err) {
                return entry;
            });

        } else if (entry.isCSS) {

            debug('File is a CSS');

            return minifyCss(entry.weightCheck.bodyBuffer.toString())

            .then(function(newFile) {
                if (!newFile) {
                    debug('Optimization didn\'t work');
                    return entry;
                }

                var endTime = Date.now();
                debug('CSS minification took %dms', endTime - startTime);

                var newFileSize = newFile.length;

                debug('CSS minification complete for %s', entry.url);
                
                if (gainIsEnough(fileSize, newFileSize)) {
                    entry.weightCheck.bodyAfterOptimization = newFile;
                    entry.weightCheck.optimized = newFileSize;
                    entry.weightCheck.isOptimized = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                }

                return entry;
            })

            .fail(function(err) {
                return entry;
            });

        } else if (entry.isHTML) {

            debug('File is an HTML');

            return minifyHtml(entry.weightCheck.bodyBuffer.toString())

            .then(function(newFile) {
                if (!newFile) {
                    debug('Optimization didn\'t work');
                    return entry;
                }

                var endTime = Date.now();
                debug('HTML minification took %dms', endTime - startTime);

                var newFileSize = newFile.length;

                debug('HTML minification complete for %s', entry.url);
                
                if (gainIsEnough(fileSize, newFileSize)) {
                    entry.weightCheck.bodyAfterOptimization = newFile;
                    entry.weightCheck.optimized = newFileSize;
                    entry.weightCheck.isOptimized = false;
                    debug('Filesize is %d bytes smaller (-%d%)', fileSize - newFileSize, Math.round((fileSize - newFileSize) * 100 / fileSize));
                }

                return entry;
            })

            .fail(function(err) {
                return entry;
            });

        } else {
            debug('Not minifiable type or already minified');
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
        
        // Splitting the Uglify function because it sometime takes too long (more than 10 seconds)
        // I hope that, by splitting, it can be a little more asynchronous, so the application doesn't freeze.

        return splittedUglifyStep1(body)
        .delay(1)
        .then(splittedUglifyStep2)
        .delay(1)
        .then(function(ast) {
            // Only do the compression step for smaller files
            // otherwise it can take a very long time compared to the gain
            if (body.length < 200*1024) {
                return splittedUglifyStep3(ast);
            } else {
                debug('Skipping step 3 because the file is too big (%d bytes)!', body.length);
                return ast;
            }
        })
        .delay(1)
        .then(splittedUglifyStep4)
        .delay(1)
        .then(splittedUglifyStep5)
        .delay(1)
        .then(splittedUglifyStep6)
        .delay(1)
        .then(splittedUglifyStep7);

    }

    function splittedUglifyStep1(code) {
        var deferred = Q.defer();
        var startTime = Date.now();

        try {
            var toplevel_ast = UglifyJS.parse(code);

            var endTime = Date.now();
            debug('Uglify step 1 took %dms', endTime - startTime);
            deferred.resolve(toplevel_ast);

        } catch(err) {
            debug('JS syntax error, Uglify\'s parser failed (step 1)');
            deferred.reject(err);
        }

        return deferred.promise;
    }

    function splittedUglifyStep2(toplevel) {
        var deferred = Q.defer();
        var startTime = Date.now();

        toplevel.figure_out_scope();

        var endTime = Date.now();
        debug('Uglify step 2 took %dms', endTime - startTime);
        deferred.resolve(toplevel);
        return deferred.promise;
    }

    function splittedUglifyStep3(toplevel) {
        var deferred = Q.defer();
        var startTime = Date.now();

        var compressor = UglifyJS.Compressor({warnings: false});
        var compressed_ast = toplevel.transform(compressor);

        var endTime = Date.now();
        debug('Uglify step 3 took %dms', endTime - startTime);
        deferred.resolve(compressed_ast);
        return deferred.promise;
    }

    function splittedUglifyStep4(compressed_ast) {
        var deferred = Q.defer();
        var startTime = Date.now();

        compressed_ast.figure_out_scope();

        var endTime = Date.now();
        debug('Uglify step 4 took %dms', endTime - startTime);
        deferred.resolve(compressed_ast);
        return deferred.promise;
    }

    function splittedUglifyStep5(compressed_ast) {
        var deferred = Q.defer();
        var startTime = Date.now();

        compressed_ast.compute_char_frequency();

        var endTime = Date.now();
        debug('Uglify step 5 took %dms', endTime - startTime);
        deferred.resolve(compressed_ast);
        return deferred.promise;
    }

    function splittedUglifyStep6(compressed_ast) {
        var deferred = Q.defer();
        var startTime = Date.now();

        compressed_ast.mangle_names();

        var endTime = Date.now();
        debug('Uglify step 6 took %dms', endTime - startTime);
        deferred.resolve(compressed_ast);
        return deferred.promise;
    }

    function splittedUglifyStep7(compressed_ast) {
        var deferred = Q.defer();
        var startTime = Date.now();

        var code = compressed_ast.print_to_string();

        var endTime = Date.now();
        debug('Uglify step 7 took %dms', endTime - startTime);
        deferred.resolve(code);
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

    // Avoid loosing time trying to compress some JS libraries known as already compressed
    function isKnownAsMinified(url) {
        var result = false;

        // Twitter
        result = result || /^https?:\/\/platform\.twitter\.com\/widgets\.js/.test(url);

        // Facebook
        result = result || /^https:\/\/connect\.facebook\.net\/[^\/]*\/(sdk|all)\.js/.test(url);

        // Google +1
        result = result || /^https:\/\/apis\.google\.com\/js\/plusone\.js/.test(url);

        // jQuery CDN
        result = result || /^https?:\/\/code\.jquery\.com\/.*\.min.js/.test(url);

        // Google Analytics
        result = result || /^https?:\/\/(www|ssl)\.google-analytics\.com\/(.*)\.js/.test(url);

        if (result === true) {
            debug('This file is known as already minified. Skipping minification: %s', url);
        }

        return result;
    }

    // Avoid loosing some trying to compress JS files if they alreay look minified
    // by counting the number of lines compared to the total size.
    // Less than 2KB per line is suspicious
    function looksAlreadyMinified(code) {
        var linesCount = code.split(/\r\n|\r|\n/).length;
        var linesRatio = code.length / linesCount;
        var looksMinified = linesRatio > 2 * 1024;
        
        debug('Lines ratio is %d bytes per line', Math.round(linesRatio));
        debug(looksMinified ? 'It looks already minified' : 'It doesn\'t look minified');

        return looksMinified;
    }

    function entryTypeCanBeMinified(entry) {
        return entry.isJS || entry.isCSS || entry.isHTML;
    }

    return {
        minifyFile: minifyFile,
        minifyJs: minifyJs,
        minifyCss: minifyCss,
        minifyHtml: minifyHtml,
        gainIsEnough: gainIsEnough,
        entryTypeCanBeMinified: entryTypeCanBeMinified,
        isKnownAsMinified: isKnownAsMinified
    };
};

module.exports = new FileMinifier();