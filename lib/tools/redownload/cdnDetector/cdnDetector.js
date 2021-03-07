var debug               = require('debug')('ylt:cdnDetector');
var Q                   = require('q');
var url                 = require('url');
var dns                 = require('dns');
var cdnDetector         = require('cdn-detector');

// This module checks my multiple ways if a request was served by a CDN

var CDNDetector = function() {

    function detectCDN(entry) {
        var urlObject = url.parse(entry.url);
        debug('Start checking CDN for %s, host is %s', entry.url, urlObject.host);

        // 1st, the fastest check: the domain is directly recognized as a CDN
        return checkDomainDirectly(entry)

        .fail(function() {

            // 2nd, check the response headers
            return checkHeaders(entry)

            .fail(function() {

                // 3rd, check the Name Servers
                return checkNameServers(entry)

                .fail(function(entry) {

                    // None of the above worked, we didn't find any trace of a CDN
                    return entry;
                });
            })
        });
    }

    return {
        detectCDN: detectCDN
    };

    // Compares the URL's domain to a list of know CDN, just in case
    function checkDomainDirectly(entry) {
        var deferred = Q.defer();

        var result = checkHostname(url.parse(entry.url).host);

        if (result === null) {
            deferred.reject(entry);
        } else {
            entry.weightCheck.cdn = result;
            deferred.resolve(entry);
        }
            
        return deferred.promise;
    }

    // Compares a list of HTTP response headers to a matching list
    // For example, if there is an X-Akamai-Request-Id header, we know it is Akamai
    function checkHeaders(entry) {
        var deferred = Q.defer();

        var result = cdnDetector.detectFromHeaders(entry.weightCheck.headers);
        debug('Headers of %s were compared to the list. Result: %s', entry.url, JSON.stringify(result));

        if (result === null) {
            deferred.reject(entry);
        } else {
            entry.weightCheck.cdn = result.cdn;
            deferred.resolve(entry);
        }
            
        return deferred.promise;
    }

    function checkNameServers(entry) {
        var deferred = Q.defer();
        var hostname = url.parse(entry.url).host;

        // Send a request to get the Name Servers list
        // https://nodejs.org/api/dns.html#dns_dns_resolvens_hostname_callback
        dns.resolveNs(hostname, function(error, nameServers) {
            if (error) {
                debug(error);
                debug('Could not find Name Servers for %s', hostname);
                deferred.reject(entry);
            } else {
                debug('Name Servers for %s are ["%s"]', hostname, nameServers.join('", "'));

                var cdn = nameServers.map(checkHostname).find(function(entry) {
                    return entry !== null;
                });

                if (cdn) {
                    entry.weightCheck.cdn = cdn;
                    deferred.resolve(entry);
                } else {
                    deferred.reject(entry);
                }
            }
        });

        return deferred.promise;
    }

    // Compares the hostname to a matching list of hostnames
    function checkHostname(hostname) {
        var result = cdnDetector.detectFromHostname(hostname);
        debug('Hostname %s was compared to the list. Result: %s', hostname, JSON.stringify(result));
        return result ? result.cdn : null;
    }

    // Find an IP address with a DNS lookup
    function getIP(hostname) {
        var deferred = Q.defer();

        // https://nodejs.org/api/dns.html#dns_dns_lookup_hostname_options_callback
        dns.lookup(hostname, {family: 4}, function(error, address) {
            if (error) {
                debug('Could not find IP address for %s', hostname);
            } else {
                debug('The IP address for %s is %s', hostname, address);
            }
            deferred.resolve(error ? null : address);
        });

        return deferred.promise;
    }

    // Compares the IP address agains a list of IP ranges
    function checkIPAddress(address) {
        var deferred = Q.defer();

        var result = cdnDetector.detectFromHeaders(headers);
        debug('Headers were compared to the list. Result: %s', JSON.stringify(result));

        if (result === null) {
            deferred.reject();
        } else {
            deferred.resolve(result.cdn);
        }

        return deferred.promise;
    }

    function saveCDN(cdnName) {

    }
};

module.exports = new CDNDetector();