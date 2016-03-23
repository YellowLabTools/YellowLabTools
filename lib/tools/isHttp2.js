var debug   = require('debug')('ylt:isHttp2');
var url     = require('url');
var Q       = require('q');
var http2   = require('is-http2');

var isHttp2 = function() {
    'use strict';

    this.check = function(data) {
        debug('Starting to check for HTTP2 support...');

        return this.checkHttp2(data)

            .then(function(result) {

                if (result.isHttp) {
                    debug('The website is not even in HTTPS');

                    data.toolsResults.http2 = {
                        metrics: {
                            http2: false
                        }
                    };

                } else if (result.isHttp2) {
                    debug('HTTP/2 (or SPDY) is supported');

                    data.toolsResults.http2 = {
                        metrics: {
                            http2: true
                        }
                    };
                
                } else {
                    debug('HTTP/2 is not supported');
                    
                    data.toolsResults.http2 = {
                        metrics: {
                            http2: false
                        }
                    };
                }

                // Add the supported protocols as offenders
                if (result.supportedProtocols) {
                    debug('Supported protocols: ' + result.supportedProtocols.join(' '));
                    data.toolsResults.http2.offenders = {
                        http2: result.supportedProtocols
                    };
                }

                debug('End of HTTP2 support check');

                return data;
            })

            .fail(function() {
                return data;
            });
    };

    this.getParsedUrl = function(data) {
        return url.parse(data.toolsResults.phantomas.url);
    };

    this.getProtocol = function(data) {
        return this.getParsedUrl(data).protocol;
    };

    this.getDomain = function(data) {
        return this.getParsedUrl(data).hostname;
    };

    this.checkHttp2 = function(data) {
        var deferred = Q.defer();

        // Check if it's HTTPS first
        if (this.getProtocol(data) === 'http:') {
            
            deferred.resolve({
                isHttp: true
            });

        } else {

            // To make is-http2 work, you need to have openssl in a version greater than 1.0.0 installed and available in your $path.
            http2(this.getDomain(data), {includeSpdy: true})

                .then(function(result) {
                    deferred.resolve(result);
                })
                
                .catch(function(error) {
                    debug('Error while checking HTTP2 support:');
                    debug(error);
                    deferred.reject('Error while checking for HTTP2 support');
                });

        }

        return deferred.promise;
    };
};

module.exports = new isHttp2();