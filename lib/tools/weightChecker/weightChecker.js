/*
 * Redownloading every files after Phantomas has finished
 * Checks weight and every kind of compression
 *
 */


var debug           = require('debug')('ylt:weightChecker');
var Q               = require('q');
var http            = require('http');
var zlib            = require('zlib');
var async           = require('async');
var request         = require('request');

var imageOptimizer  = require('./imageOptimizer');


var WeightChecker = function() {

    var MAX_PARALLEL_DOWNLOADS = 10;
    var REQUEST_TIMEOUT = 10000; // 10 seconds


    // This function will re-download every asset and check if it could be optimized
    function recheckAllFiles(data) {
        var deferred = Q.defer();

        var requestsList = JSON.parse(data.toolsResults.phantomas.offenders.requestsList);
        delete data.toolsResults.phantomas.metrics.requestsList;
        delete data.toolsResults.phantomas.offenders.requestsList;

        // Transform every request into a download function with a callback when done
        var redownloadList = requestsList.map(function(entry) {
            return function(callback) {
                
                redownloadEntry(entry)

                .then(imageOptimizer.recompressIfImage)

                .then(function(newEntry) {
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
                
                var metrics = {};
                var offenders = {};


                // Total weight
                offenders.totalWeight = listRequestWeight(results);
                metrics.totalWeight = offenders.totalWeight.totalWeight;

                // Image compression
                offenders.imageOptimization = listImageNotOptimized(results);
                metrics.imageOptimization = offenders.imageOptimization.totalGain;


                data.toolsResults.weightChecker = {
                    metrics: metrics,
                    offenders: offenders
                };

                deferred.resolve(data);
            }
        });

        return deferred.promise;
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

            results.totalWeight += weight;
            results.byType[type].totalWeight += weight;

            results.byType[type].requests.push({
                url: req.url,
                weight: weight
            });
        });

        return results;
    }


    function listImageNotOptimized(requests) {
        var results = {
            totalGain: 0,
            images: []
        };

        requests.forEach(function(req) {
            if (req.weightCheck.bodySize && req.weightCheck.isOptimized === false) {
                var gain = req.weightCheck.bodySize - req.weightCheck.optimized;

                results.totalGain += gain;

                results.images.push({
                    url: req.url,
                    original: req.weightCheck.bodySize,
                    optimized: req.weightCheck.optimized,
                    lossless: req.weightCheck.lossless,
                    lossy: req.weightCheck.lossy,
                    gain: gain
                });
            }
        });

        return results;
    }


    function redownloadEntry(entry) {
        var deferred = Q.defer();
        
        function onError(message) {
            debug('Could not download %s Error: %s', entry.url, message);
            entry.weightCheck = {
                message: message
            };
            deferred.resolve(entry);
        }

        if (entry.method !== 'GET') {
            onError('only downloading GET');
            return deferred.promise;
        }

        if (entry.status !== 200) {
            onError('only downloading requests with status code 200');
            return deferred.promise;
        }

        if (entry.url === 'about:blank') {
            onError('not downloading about:blank');
            return deferred.promise;
        }


        debug('Downloading %s', entry.url);

        // Always add a gzip header before sending, in case the server listens to it
        var reqHeaders = entry.requestHeaders;
        reqHeaders['Accept-Encoding'] = 'gzip, deflate';

        var requestOptions = {
            method: entry.method,
            url: entry.url,
            headers: reqHeaders,
            timeout: REQUEST_TIMEOUT
            //encoding: (entry.contentType === 'image/jpeg' || entry.contentType === 'image/png') ? 'binary' : null
        };

        download(requestOptions, entry.contentType, function(error, result) {
            if (error) {
                if (error.code === 'ETIMEDOUT') {
                    onError('timeout after ' + REQUEST_TIMEOUT + 'ms');
                } else {
                    onError('error while downloading: ' + error.code);
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
            var body = '';  // plain text body (after uncompressing gzip/deflate)
            var isCompressed = false;

            function tally() {

                if (statusCode !== 200) {
                    callback({code: statusCode});
                    return;
                }

                var result = {
                    body: body,
                    headersSize: Buffer.byteLength(rawHeaders, 'utf8'),
                    bodySize: bodySize,
                    isCompressed: isCompressed,
                    uncompressedSize: uncompressedSize
                };

                callback(null, result);
            }

            switch (res.headers['content-encoding']) {
                case 'gzip':

                    var gzip = zlib.createGunzip();

                    gzip.on('data', function (data) {
                        body += data;
                        uncompressedSize += data.length;
                    }).on('end', function () {
                        isCompressed = true;
                        tally();
                    }).on('error', function(err) {
                        debug(err);
                    });

                    res.on('data', function (data) {
                        bodySize += data.length;
                    }).pipe(gzip);

                    break;
                case 'deflate':
                    res.setEncoding('utf8');

                    var deflate = zlib.createInflate();

                    deflate.on('data', function (data) {
                        body += data;
                        uncompressedSize += data.length;
                    }).on('end', function () {
                        isCompressed = true;
                        tally();
                    }).on('error', function(err) {
                        debug(err);
                    });

                    res.on('data', function (data) {
                        bodySize += data.length;
                    }).pipe(deflate);

                    break;
                default:
                    if (contentType === 'image/jpeg' || contentType === 'image/png') {
                        res.setEncoding('binary');
                    }

                    res.on('data', function (data) {
                        body += data;
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
            callback(err);
        });
    }


    return {
        recheckAllFiles: recheckAllFiles,
        listRequestWeight: listRequestWeight,
        redownloadEntry: redownloadEntry,
        download: download
    };
};

module.exports = new WeightChecker();