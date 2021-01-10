/*
 * Redownloading every files after Phantomas has finished
 * Checks weight and every kind of compression
 *
 */

/*jshint -W069 */

var debug               = require('debug')('ylt:redownload');
var Q                   = require('q');
var http                = require('http');
var zlib                = require('zlib');
var async               = require('async');
var request             = require('request');
var md5                 = require('md5');

var imageOptimizer      = require('./imageOptimizer');
var fileMinifier        = require('./fileMinifier');
var gzipCompressor      = require('./gzipCompressor');
var brotliCompressor    = require('./brotliCompressor');
var contentTypeChecker  = require('./contentTypeChecker');
var fontAnalyzer        = require('./fontAnalyzer');
var imageDimensions     = require('./imageDimensions');


var Redownload = function() {

    var MAX_PARALLEL_DOWNLOADS = 5;
    var REQUEST_TIMEOUT = 30000; // 30 seconds


    // This function will re-download every asset and check if it could be optimized
    function recheckAllFiles(data) {
        var startTime = Date.now();
        debug('Redownload started');
        
        var deferred = Q.defer();

        var requestsOffenders = data.toolsResults.phantomas.offenders.requests;
        var gzipOffenders = data.toolsResults.phantomas.offenders.gzipRequests;
        var postOffenders = data.toolsResults.phantomas.offenders.postRequests;
        var notFoundOffenders = data.toolsResults.phantomas.offenders.notFound;
        var redirectOffenders = data.toolsResults.phantomas.offenders.redirects;

        var requestsList = mergeOffenders(requestsOffenders, gzipOffenders, postOffenders, notFoundOffenders, redirectOffenders);

        var totalCount = requestsList.length;
        var doneCount = 0;

        var httpAuth = null;
        if (data.params && data.params.options && data.params.options.authUser && data.params.options.authPass) {
            httpAuth = {
                username: data.params.options.authUser,
                password: data.params.options.authPass
            };
        }

        var proxy = null;
        if (data.params && data.params.options && data.params.options.proxy) {
            proxy = data.params.options.proxy;
            if (proxy.indexOf('http:') === -1) {
                proxy = 'http://' + proxy;
            }
        }

        // Prevent a bug with the font analyzer on empty pages
        var differentCharacters = '';
        if (data.toolsResults.phantomas.offenders.differentCharacters && data.toolsResults.phantomas.offenders.differentCharacters.length > 0) {
            differentCharacters = data.toolsResults.phantomas.offenders.differentCharacters[0];
        }

        // Transform every request into a download function with a callback when done
        var redownloadList = requestsList.map(function(entry) {
            return function(callback) {
                
                redownloadEntry(entry, httpAuth, proxy)

                .then(contentTypeChecker.checkContentType)

                .then(imageOptimizer.optimizeImage)

                .then(imageDimensions.getDimensions)

                .then(fileMinifier.minifyFile)

                .then(gzipCompressor.compressFile)

                .then(brotliCompressor.compressFile)

                .then(function(entry) {
                    return fontAnalyzer.analyzeFont(entry, differentCharacters);
                })

                .then(function(newEntry) {
                    debug('File %s - Redownloaded, optimized, minified, compressed, analyzed: done', entry.url);

                    // For the progress bar
                    doneCount ++;
                    deferred.notify(doneCount/totalCount);

                    callback(null, newEntry);
                })

                .fail(function(err) {
                    callback(err);
                });
            };
        });

        // Lanch all redownload functions and wait for completion
        async.parallelLimit(redownloadList, MAX_PARALLEL_DOWNLOADS, function(err, results) {
            
            if (err) {
                debug(err);
                deferred.reject(err);
            } else {

                debug('All files checked');
                endTime = Date.now();
                debug('Redownload took %d ms', endTime - startTime);
                
                var metrics = {};
                var offenders = {};


                // Count requests
                offenders.totalRequests = listRequestsByType(results);
                metrics.totalRequests = offenders.totalRequests.total;


                // Remove unwanted responses (redownload failed, about:blank)
                results = results.filter(function(result) {
                    return (result !== null && result.weightCheck && result.url.indexOf('about:blank') !== 0);
                });


                // Wrong contentType
                offenders.incorrectContentTypes = listIncorrectContentTypes(results);
                metrics.incorrectContentTypes = offenders.incorrectContentTypes.length;

                // Total weight
                offenders.totalWeight = listRequestWeight(results);
                metrics.totalWeight = offenders.totalWeight.totalWeight;

                // Empty files
                offenders.emptyRequests = listEmptyRequests(results);
                metrics.emptyRequests = offenders.emptyRequests.length;

                // Remove some more unwanted responses (redirections and empty files)
                results = results.filter(function(result) {
                    return (/* (result.status < 300 || result.status >= 400) && */ result.weightCheck.bodySize > 0);
                });

                // Image compression
                offenders.imageOptimization = listImagesNotOptimized(results);
                metrics.imageOptimization = offenders.imageOptimization.totalGain;

                // Image width
                offenders.imagesTooLarge = listImagesTooLarge(results, data.params.options.device);
                metrics.imagesTooLarge = offenders.imagesTooLarge.length;

                // File minification
                offenders.fileMinification = listFilesNotMinified(results);
                metrics.fileMinification = offenders.fileMinification.totalGain;

                // Gzip/Brotli compression
                offenders.compression = listFilesNotBrotlified(results);
                metrics.compression = offenders.compression.totalGain;

                // Detect identical files
                offenders.identicalFiles = listIdenticalFiles(results);
                metrics.identicalFiles = offenders.identicalFiles.avoidableRequests;

                // Fonts count
                offenders.fontsCount = listFonts(results);
                metrics.fontsCount = offenders.fontsCount.count;

                // Conversion to woff2
                offenders.nonWoff2Fonts = listNonWoff2Fonts(results);
                metrics.nonWoff2Fonts = offenders.nonWoff2Fonts.totalGain;

                // Heavy fonts
                offenders.heavyFonts = listHeavyFonts(results);
                metrics.heavyFonts = offenders.heavyFonts.totalGain;

                // Unused Unicode ranges
                offenders.unusedUnicodeRanges = listUnusedUnicodeRanges(results);
                metrics.unusedUnicodeRanges = offenders.unusedUnicodeRanges.count;

                // Detect WordPress
                metrics.isWordPress = detectWordPress(results);

                data.toolsResults.redownload = {
                    metrics: metrics,
                    offenders: offenders
                };

                deferred.resolve(data);
            }
        });

        return deferred.promise;
    }

    function mergeOffenders(requests, compressedOffenders, postOffenders, notFoundOffenders, redirectOffenders) {
        
        // Parse each request and check if it can be found in other offenders
        requests.forEach(function(request) {

            // Is it compressed?
            if (compressedOffenders) {
                compressedOffenders.some(function(entry) {
                    if (entry.url === request.url) {
                        request.compressed = true;
                        request.bodySize = entry.bodySize;
                        request.transferedSize = entry.transferedSize;
                        return true;
                    }
                });
            }

            // Is it a POST request?
            if (postOffenders) {
                postOffenders.some(function(url) {
                    if (url === request.url) {
                        request.post = true;
                        return true;
                    }
                });
            }

            // Is it a 404?
            if (notFoundOffenders) {
                notFoundOffenders.some(function(url) {
                    if (url === request.url) {
                        request.notFound = true;
                        return true;
                    }
                });
            }

            // Is it a redirection?
            if (redirectOffenders) {
                redirectOffenders.some(function(message) {
                    if (message.split(' ')[0] === request.url) {
                        request.redirect = true;
                        return true;
                    }
                });
            }
        });

        return requests;
    }

    function listIncorrectContentTypes(requests) {
        var results = [];
        
        requests.forEach(function(req) {
            if (req.oldContentType || req.oldContentType === null) {
                results.push({
                    url: req.url,
                    current: req.oldContentType,
                    correct: req.contentType
                });
            }
        });

        return results;
    }

    function listEmptyRequests(requests) {
        var results = [];
        
        requests.forEach(function(req) {
            var weight = req.weightCheck.bodySize || req.contentLength;

            if (weight === 0 && req.method === 'GET' && req.status === 200) {
                results.push(req.url);
            }
        });

        return results;
    }

    function listRequestWeight(requests) {
        var results = {
            totalWeight: 0,
            byType: {
                html: {
                    totalWeight: 0,
                    requests: []
                },
                css: {
                    totalWeight: 0,
                    requests: []
                },
                js: {
                    totalWeight: 0,
                    requests: []
                },
                json: {
                    totalWeight: 0,
                    requests: []
                },
                image: {
                    totalWeight: 0,
                    requests: []
                },
                video: {
                    totalWeight: 0,
                    requests: []
                },
                webfont: {
                    totalWeight: 0,
                    requests: []
                },
                other: {
                    totalWeight: 0,
                    requests: []
                }
            }
        };

        requests.forEach(function(req) {
            var weight = ((typeof req.weightCheck.bodySize === 'number') ? req.weightCheck.bodySize + req.weightCheck.headersSize : req.contentLength) || 0;
            var type = req.type || 'other';
            type = (results.byType[type]) ? type : 'other';

            results.totalWeight += weight;
            results.byType[type].totalWeight += weight;

            results.byType[type].requests.push({
                url: req.url,
                weight: weight
            });
        });

        return results;
    }


    function listImagesNotOptimized(requests) {
        var results = {
            totalGain: 0,
            images: []
        };

        requests.forEach(function(req) {

            if (req.weightCheck.bodySize > 0 && imageOptimizer.entryTypeCanBeOptimized(req) && req.weightCheck.isOptimized === false) {

                var before, after;

                if (req.weightCheck.isCompressed === true) {
                    // The resource is compressed

                    before = req.weightCheck.bodySize;
                    
                    if (req.weightCheck.compressionTool === 'brotli') {
                        after = req.weightCheck.afterOptimizationAndBrotliCompression;
                    } else {
                        after = req.weightCheck.afterOptimizationAndGzipCompression;
                    }

                } else if (req.weightCheck.afterBrotliCompression) {
                    // The resource is not compressed but should be

                    before = req.weightCheck.afterBrotliCompression;
                    after = req.weightCheck.afterOptimizationAndBrotliCompression;
                } else {
                    // The resource is not compressed but is not subject to compression

                    before = req.weightCheck.bodySize;
                    after = req.weightCheck.optimized;
                }

                var gain = before - after;

                if (gain > 200) {
                    results.totalGain += gain;

                    results.images.push({
                        url: req.url,
                        originalWeigth: req.weightCheck.bodySize,
                        isCompressible: (req.weightCheck.afterBrotliCompression > 0),
                        isCompressed: req.weightCheck.isCompressed,
                        originalCompressedWeight: before,
                        afterOptimizationAndCompression: after,
                        lossless: req.weightCheck.lossless,
                        lossy: req.weightCheck.lossy,
                        gain: gain
                    });
                }
            }
        });
        return results;
    }

    function listImagesTooLarge(requests, device) {
        var results = [];

        requests.forEach(function(req) {
            const thresholds = {
                'phone': 1200,
                'tablet': 1800,
                'desktop': 2400,
                'desktop-hd': 3200
            };

            if (req.weightCheck.bodySize > 0 && 
                req.imageDimensions &&
                req.imageDimensions.width > thresholds[device]) {

                results.push({
                    url: req.url,
                    weight: req.weightCheck.bodySize,
                    width: req.imageDimensions.width,
                    height: req.imageDimensions.height
                });
            }
        });

        return results;
    }


    function listFilesNotMinified(requests) {
        var results = {
            totalGain: 0,
            files: []
        };

        requests.forEach(function(req) {
            if (req.weightCheck.bodySize > 0 && fileMinifier.entryTypeCanBeMinified(req) && req.weightCheck.isOptimized === false) {
                var before, after;

                if (req.weightCheck.isCompressed === true) {
                    // The resource is compressed

                    before = req.weightCheck.bodySize;
                    
                    if (req.weightCheck.compressionTool === 'brotli') {
                        after = req.weightCheck.afterOptimizationAndBrotliCompression;
                    } else {
                        after = req.weightCheck.afterOptimizationAndGzipCompression;
                    }

                } else if (req.weightCheck.afterBrotliCompression) {
                    // The resource is not compressed but should be

                    before = req.weightCheck.afterBrotliCompression;
                    after = req.weightCheck.afterOptimizationAndBrotliCompression;
                } else {
                    // The resource is not compressed but is not subject to compression

                    before = req.weightCheck.bodySize;
                    after = req.weightCheck.optimized;
                }

                var gain = before - after;

                if (gain > 200) {
                    results.totalGain += gain;

                    results.files.push({
                        url: req.url,
                        originalWeigth: req.weightCheck.bodySize,
                        isCompressible: (req.weightCheck.afterBrotliCompression > 0),
                        isCompressed: req.weightCheck.isCompressed,
                        originalCompressedWeight: before,
                        afterOptimizationAndCompression: after,
                        optimized: req.weightCheck.optimized,
                        gain: gain
                    });
                }
            }
        });

        return results;
    }

    function listFilesNotBrotlified(requests) {
        var results = {
            totalGain: 0,
            files: []
        };

        requests.forEach(function(req) {
            if (req.weightCheck.compressionTool !== 'brotli') {
                
                var file = {
                    url: req.url,
                    wasCompressed: req.weightCheck.isCompressed,
                    brotlified: req.weightCheck.afterBrotliCompression
                };

                if (req.weightCheck.isCompressed) {
                    // The file was already gzipped (or deflated)
                    file.originalSize = req.weightCheck.bodySize;
                    file.gain = req.weightCheck.bodySize - req.weightCheck.afterBrotliCompression;
                } else {
                    // The file was not compressed at all
                    file.originalSize = req.weightCheck.uncompressedSize;
                    file.gzipped = req.weightCheck.afterGzipCompression;
                    file.gain = req.weightCheck.uncompressedSize - req.weightCheck.afterBrotliCompression;
                }

                // Just checking a last time if the gain is positive
                if (file.gain > 200) {
                    results.totalGain += file.gain;
                    results.files.push(file);
                }
            }
        });

        return results;
    }

    function listRequestsByType(requests) {
        var results = {
            total: 0,
            byType: {
                html: [],
                css: [],
                js: [],
                json: [],
                image: [],
                video: [],
                webfont: [],
                other: []
            }
        };

        requests.forEach(function(req) {
            if (req.url !== 'about:blank') {
                var type = req.type || 'other';
                type = (results.byType[type]) ? type : 'other';
                
                results.byType[type].push(req.url);
                results.total ++;
            }
        });

        return results;
    }

    function listIdenticalFiles(requests) {
        var hashes = {};
        var list = [];
        var avoidableRequestsCount = 0;

        requests.forEach(function(req) {
            var requestHash = md5(req.weightCheck.bodyBuffer);
            
            // Try to exclude tracking pixels
            if (req.weightCheck.bodySize < 80 && req.type === 'image') {
                return;
            }

            if (!hashes[requestHash]) {
                hashes[requestHash] = {
                    weight: req.weightCheck.bodySize,
                    urls: []
                };
            }
            
            if (hashes[requestHash].urls.indexOf(req.url) === -1) {
                hashes[requestHash].urls.push(req.url);
            }
        });

        for (var hash in hashes) {
            if (hashes[hash].urls.length > 1) {
                list.push(hashes[hash]);
                avoidableRequestsCount += hashes[hash].urls.length - 1;
            }
        }

        return {
            avoidableRequests: avoidableRequestsCount,
            count: list.length,
            list: list
        };
    }

    function listFonts(requests) {
        var list = [];

        requests.forEach(function(req) {
            if (req.isWebFont) {
                list.push({
                    url: req.url,
                    size: req.weightCheck.bodySize
                });
            }
        });

        return {
            count: list.length,
            list: list
        };
    }

    function listNonWoff2Fonts(requests) {
        var results = {
            totalGain: 0,
            fonts: []
        };

        requests.forEach(function(req) {
            if (!req.isWoff2 && req.weightCheck.sizeAsWoff2) {
                var before = req.weightCheck.bodySize;
                var after = req.weightCheck.sizeAsWoff2;
                var gain = before - after;
                
                var type = null;
                if (req.isWoff) {
                    type = 'woff';
                } else if (req.isTtf) {
                    type = 'ttf';
                }

                if (gain > 200) {
                    results.totalGain += gain;

                    results.fonts.push({
                        url: req.url,
                        originalSize: before,
                        type: type,
                        woff2Size: after,
                        gain: gain
                    });
                }
            }
        });

        return results;
    }

    function listHeavyFonts(requests) {
        var list = [];
        var totalGain = 0;
        var heavyFontsCount = 0;
        var MAX_FONT_WEIGHT = 40 * 1024;

        requests.forEach(function(req) {
            if (req.isWebFont && req.fontMetrics) {
                list.push({
                    url: req.url,
                    weight: req.weightCheck.bodySize,
                    numGlyphs: req.fontMetrics.numGlyphs,
                    averageGlyphComplexity: req.fontMetrics.averageGlyphComplexity
                });
                if (req.weightCheck.bodySize > MAX_FONT_WEIGHT) {
                    totalGain += req.weightCheck.bodySize - MAX_FONT_WEIGHT;
                    heavyFontsCount ++;
                }
            }
        });

        return {
            count: heavyFontsCount,
            fonts: list,
            totalGain: totalGain
        };
    }

    function listUnusedUnicodeRanges(requests) {
        var list = [];
        var unusedUnicodeRanges = 0;

        requests.forEach(function(req) {
            if (req.isWebFont && req.fontMetrics && req.fontMetrics.unicodeRanges) {
                var ranges = [];
                var others = null;
                var rangeNames = Object.keys(req.fontMetrics.unicodeRanges);
                var unicodePointsCount = 0;
                var unusedRangesInFont = 0;
                
                rangeNames.forEach(function(rangeName) {
                    var range = req.fontMetrics.unicodeRanges[rangeName];

                    // Exclude "Others"
                    if (rangeName === 'Others') {
                        if (range.numGlyphsInCommonWithPageContent === 0 && range.charset.length > 50) {
                            range.underused = true;
                            unusedRangesInFont ++;
                        }

                        unicodePointsCount += range.charset.length;
                        others = range;
                    } else if (range.charset.length > 0) {
                        // Now lets detect if the current Unicode range is unused.
                        // Reminder: range.coverage = glyphs declared in this range, divided by the range size
                        if (range.coverage > 0.25 && range.numGlyphsInCommonWithPageContent === 0) {
                            range.underused = true;
                            unusedRangesInFont ++;
                        }

                        unicodePointsCount += range.charset.length;
                        ranges.push(range);
                    }
                });


                // Detect if it's a icons font : if more than 90% of the icons are
                // in the "Others", it looks like one.
                if (others && others.charset.length / req.fontMetrics.numGlyphs > 0.9) {
                    
                    list.push({
                        url: req.url,
                        weight: req.weightCheck.bodySize,
                        isIconFont: true,
                        glyphs: req.fontMetrics.numGlyphs,
                        numGlyphsInCommonWithPageContent: req.fontMetrics.numGlyphsInCommonWithPageContent
                    });

                    // And if less than 5% of the icons are used, let's report it as underused
                    if (others && others.numGlyphsInCommonWithPageContent / others.charset.length <= 0.05) {
                        unusedRangesInFont = 1;
                    }

                // Not an icons font
                } else {
                    if (others) {
                        // Insert back "Others" at the end of the list
                        ranges.push(others);
                    }

                    var ligaturesOrHiddenChars = req.fontMetrics.numGlyphs - unicodePointsCount;
                    if (ligaturesOrHiddenChars > 25) {
                        unusedUnicodeRanges ++;
                    }

                    list.push({
                        url: req.url,
                        weight: req.weightCheck.bodySize,
                        isIconFont: false,
                        unicodeRanges: ranges,
                        ligaturesOrHiddenChars: ligaturesOrHiddenChars 
                    });
                }

                unusedUnicodeRanges += unusedRangesInFont;
            }
        });

        return {
            count: unusedUnicodeRanges,
            fonts: list
        };
    }

    function detectWordPress(requests) {
        // Check the first HTML file only
        var htmlRequest = requests.find(function(request) {
            return request.isHTML && request.weightCheck && request.weightCheck.bodyBuffer;
        });

        debug('Checking if it is WordPress on file %s', htmlRequest.url);

        if (htmlRequest && htmlRequest.weightCheck.bodyBuffer.indexOf('/wp-content/') >= 0) {
            debug('Response: yes.');
            return true;
        } else {
            debug('Response: no.');
            return false;
        }
    }


    function redownloadEntry(entry, httpAuth, proxy) {
        var deferred = Q.defer();
        
        function downloadError(message) {
            debug('Could not download %s Error: %s', entry.url, message);
            entry.weightCheck = {
                message: message
            };
            deferred.resolve(entry);
        }

        // Not downloaded again but will be counted in totalWeight
        function notDownloadableFile(message) {
            entry.weightCheck = {
                message: message
            };
            deferred.resolve(entry);
        }

        // Not counted in totalWeight
        function unwantedFile(message) {
            debug(message);
            deferred.resolve(entry);
        }

        if (entry.post) {
            notDownloadableFile('only downloading GET');
            // ... at least trying to
            return deferred.promise;
        }

        if (entry.notFound || entry.redirect) {
            unwantedFile('only downloading requests with status code 200');
            // ...at least trying to
            return deferred.promise;
        }

        if (entry.url === 'about:blank') {
            unwantedFile('not downloading about:blank');
            return deferred.promise;
        }

        debug('Downloading %s', entry.url);

        // Always add compression and webp headers before sending, in case the server listens to them
        var reqHeaders = [];
        reqHeaders['Accept'] = '*/*,image/webp';
        reqHeaders['Accept-Encoding'] = 'gzip, deflate, br';
        reqHeaders['Connection'] = 'keep-alive';

        var requestOptions = {
            method: entry.method,
            url: entry.url,
            headers: reqHeaders,
            timeout: REQUEST_TIMEOUT,
            proxy: proxy
        };

        // Basic auth
        if (httpAuth) {
            requestOptions.auth = {
                user: httpAuth.username,
                pass: httpAuth.password,
                sendImmediately: false // Tries a first time without auth, wait for a 401 error before resending
            };
        }

        download(requestOptions, entry.contentType, function(error, result) {
            if (error) {
                if (error.code === 'ETIMEDOUT') {
                    downloadError('timeout after ' + REQUEST_TIMEOUT + 'ms');
                } else {
                    downloadError('error while downloading: ' + error.code);
                }
                return;
            }
                
            debug('%s downloaded correctly', entry.url);

            entry.weightCheck = result;
            deferred.resolve(entry);
        });

        return deferred.promise;
    }

    // Inspired by https://github.com/cvan/fastHAR-api/blob/10cec585/app.js
    function download(requestOptions, contentType, callback) {

        var statusCode;

        try {

            request(requestOptions)

            .on('response', function(res) {
                
                // Raw headers were added in NodeJS v0.12
                // (https://github.com/joyent/node/issues/4844), but let's
                // reconstruct them for backwards compatibility.
                var rawHeaders = ('HTTP/' + res.httpVersion + ' ' + res.statusCode +
                                  ' ' + http.STATUS_CODES[res.statusCode] + '\r\n');
                Object.keys(res.headers).forEach(function(headerKey) {
                    rawHeaders += headerKey + ': ' + res.headers[headerKey] + '\r\n';
                });
                rawHeaders += '\r\n';

                var uncompressedSize = 0;  // size after uncompression
                var bodySize = 0;  // bytes size over the wire
                var bodyChunks = [];  // an array of buffers
                var isCompressed = false;
                var compressionTool = '';

                function tally() {

                    if (statusCode !== 200) {
                        callback({code: statusCode});
                        return;
                    }

                    var body = Buffer.concat(bodyChunks);

                    var result = {
                        bodyBuffer: body,
                        headersSize: Buffer.byteLength(rawHeaders, 'utf8'),
                        bodySize: bodySize,
                        isCompressed: isCompressed,
                        compressionTool: compressionTool,
                        uncompressedSize: uncompressedSize
                    };

                    callback(null, result);
                }

                switch (res.headers['content-encoding']) {
                    case 'gzip':

                        var gzip = zlib.createGunzip();

                        gzip.on('data', function (data) {

                            bodyChunks.push(data);
                            uncompressedSize += data.length;
                        }).on('end', function () {
                            isCompressed = true;
                            compressionTool = 'gzip';
                            tally();
                        }).on('error', function(err) {
                            debug('Error while decoding %s', requestOptions.url);
                            debug(err);
                            callback(err);
                        });

                        res.on('data', function (data) {
                            bodySize += data.length;
                        }).pipe(gzip);

                        break;
                    case 'deflate':
                        res.setEncoding('utf8');

                        var deflate = zlib.createInflate();

                        deflate.on('data', function (data) {
                            bodyChunks.push(data);
                            uncompressedSize += data.length;
                        }).on('end', function () {
                            isCompressed = true;
                            compressionTool = 'deflate';
                            tally();
                        }).on('error', function(err) {
                            debug('Error while decoding %s', requestOptions.url);
                            debug(err);
                            callback(err);
                        });

                        res.on('data', function (data) {
                            bodySize += data.length;
                        }).pipe(deflate);

                        break;
                    case 'br':

                        var brotli = zlib.createBrotliDecompress();

                        brotli.on('data', function (data) {

                            bodyChunks.push(data);
                            uncompressedSize += data.length;
                        }).on('end', function () {
                            isCompressed = true;
                            compressionTool = 'brotli';
                            tally();
                        }).on('error', function(err) {
                            debug('Error while decoding %s', requestOptions.url);
                            debug(err);
                            callback(err);
                        });

                        res.on('data', function (data) {
                            bodySize += data.length;
                        }).pipe(brotli);

                        break;
                    default:
                        res.on('data', function (data) {
                            bodyChunks.push(data);
                            uncompressedSize += data.length;
                            bodySize += data.length;
                        }).on('end', function () {
                            tally();
                        });

                        break;
                }
            })

            .on('response', function(response) {
                statusCode = response.statusCode;
            })

            .on('error', function(err) {
                debug('Error while downloading %s', requestOptions.url);
                debug(err);
                callback(err);
            });

        } catch(err) {
            debug('Error while downloading %s', requestOptions.url);
            debug(err);
            callback(err);
        }
    }

    return {
        recheckAllFiles: recheckAllFiles,
        listRequestWeight: listRequestWeight,
        redownloadEntry: redownloadEntry,
        download: download
    };
};

module.exports = new Redownload();