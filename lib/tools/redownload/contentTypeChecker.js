var debug   = require('debug')('ylt:contentTypeChecker');
var Q       = require('q');
var isJpg   = require('is-jpg');
var isPng   = require('is-png');
var isSvg   = require('is-svg');
var isGif   = require('is-gif');
var isWoff  = require('is-woff');
var isWoff2 = require('is-woff2');
var isOtf   = require('is-otf');
var isTtf   = require('is-ttf');
var isEot   = require('is-eot');

var ContentTypeChecker = function() {

    function checkContentType(entry) {
        var deferred = Q.defer();

        debug('Entering contentTypeChecker');
        
        // Ignore very small files as they are generally tracking pixels
        if (entry.weightCheck && entry.weightCheck.bodyBuffer && entry.weightCheck.bodySize > 100) {
            var foundType;

            try {
                foundType = findContentType(entry.weightCheck.bodyBuffer);
            
                if (!entry.contentType || entry.contentType === '') {
                    if (foundType === null) {
                        debug('ContentType is empty for file %s', entry.url);
                    } else {
                        debug('ContentType is empty for file %s. It should be %s.', entry.url, foundType.mimes[0]);
                        entry.oldContentType = null;
                        rewriteContentType(entry, foundType);
                    }
                } else {
                    if (foundType !== null && foundType.mimes.indexOf(entry.contentType) === -1) {
                        debug('ContentType %s is wrong for %s. It should be %s.', entry.contentType, entry.url, foundType.mimes[0]);
                        entry.oldContentType = entry.contentType;
                        rewriteContentType(entry, foundType);
                    }
                }

            } catch(err) {
                debug('Error while analyzing the contentType of %s', entry.url);
                debug(err);
            }
        }

        deferred.resolve(entry);

        return deferred.promise;
    }

    function findContentType(bodyBuffer) {
        var bodyStr = bodyBuffer.toString();

        if (isJpg(bodyBuffer)) {
            return contentTypes.jpeg;
        }

        if (isPng(bodyBuffer)) {
            return contentTypes.png;
        }

        // https://github.com/sindresorhus/is-svg/issues/7
        if (/<svg/.test(bodyStr) && isSvg(bodyStr)) {
            return contentTypes.svg;
        }

        if (isGif(bodyBuffer)) {
            return contentTypes.gif;
        }

        if (isWoff(bodyBuffer)) {
            return contentTypes.woff;
        }

        if (isWoff2(bodyBuffer)) {
            return contentTypes.woff2;
        }

        if (isOtf(bodyBuffer)) {
            return contentTypes.otf;
        }

        if (isTtf(bodyBuffer)) {
            return contentTypes.ttf;
        }

        if (isEot(bodyBuffer)) {
            return contentTypes.eot;
        }

        return null;
    }


    function rewriteContentType(entry, contentTypeObj) {
        delete(entry.isHTML);
        delete(entry.isXML);
        delete(entry.isCSS);
        delete(entry.isJS);
        delete(entry.isJSON);
        delete(entry.isImage);
        delete(entry.isSVG);
        delete(entry.isVideo);
        delete(entry.isWebFont);
        delete(entry.isTTF);
        delete(entry.isFavicon);

        entry.contentType = contentTypeObj.mimes[0];
        contentTypeObj.updateFn(entry);
    }

    var contentTypes = {
        jpeg: {
            mimes: ['image/jpeg'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
            }
        },
        png: {
            mimes: ['image/png'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
            }
        },
        svg: {
            mimes: ['image/svg+xml'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
                entry.isSVG = true;
            }
        },
        gif: {
            mimes: ['image/gif'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
            }
        },
        woff: {
            mimes: ['application/x-font-woff', 'application/font-woff', 'font/woff'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
            }
        },
        woff2: {
            mimes: ['font/woff2', 'application/x-font-woff2', 'application/font-woff2'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
            }
        },
        otf: {
            mimes: ['application/x-font-otf', 'font/otf', 'font/opentype', 'application/x-font-opentype'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
            }
        },
        ttf: {
            mimes: ['application/x-font-ttf', 'font/ttf', 'application/x-font-truetype'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
            }
        },
        eot: {
            mimes: ['application/vnd.ms-fontobject', 'font/eot'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
            }
        }
    };
    
    return {
        checkContentType: checkContentType,
        findContentType: findContentType
    };
};

module.exports = new ContentTypeChecker();