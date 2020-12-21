var debug   = require('debug')('ylt:contentTypeChecker');
var Q       = require('q');
var isJpg   = require('is-jpg');
var isPng   = require('is-png');
var isSvg   = require('is-svg');
var isGif   = require('is-gif');
var isWebp  = require('is-webp');
var isWoff  = require('is-woff');
var isWoff2 = require('is-woff2');
var isOtf   = require('is-otf');
var isTtf   = require('is-ttf');
var isEot   = require('is-eot');

var ContentTypeChecker = function() {

    function checkContentType(entry) {
        var deferred = Q.defer();
        
        // Setting isSomething values:
        switch(entry.type) {
            case 'html':
                entry.isHTML = true;
                break;
            case 'xml':
                entry.isXML = true;
                break;
            case 'css':
                entry.isCSS = true;
                break;
            case 'js':
                entry.isJS = true;
                break;
            case 'json':
                entry.isJSON = true;
                break;
            case 'image':
                entry.isImage = true;
                break;
            case 'webfont':
                entry.isWebFont = true;
                break;
            case 'video':
                entry.isVideo = true;
                break;
            case 'favicon':
                entry.isFavicon = true;
                break;
        }

        // Now let's check for mistakes by analysing body content. It happens more often then we think!

        // Ignore very small files as they are generally tracking pixels
        if (entry.weightCheck && entry.weightCheck.bodyBuffer && entry.weightCheck.bodySize > 100) {
            var foundType;

            try {
                foundType = findContentType(entry.weightCheck.bodyBuffer);

                if (foundType !== null) {
                    if (foundType.type === 'webfont') {
                        // Always rewrite fonts for woff2 checking
                        rewriteContentType(entry, foundType);
                    } else if (foundType.type !== entry.type) {
                        // For other kind of files, just rewrite if needed
                        debug('Content type %s is wrong for %s. It should be %s.', entry.type, entry.ulr, foundType.type);
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

        if (isWebp(bodyBuffer)) {
            return contentTypes.webp;
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
            type: 'image',
            mimes: ['image/jpeg'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
            }
        },
        png: {
            type: 'image',
            mimes: ['image/png'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
            }
        },
        svg: {
            type: 'image',
            mimes: ['image/svg+xml'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
                entry.isSVG = true;
            }
        },
        gif: {
            type: 'image',
            mimes: ['image/gif'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
            }
        },
        webp: {
            type: 'image',
            mimes: ['image/webp'],
            updateFn: function(entry) {
                entry.type = 'image';
                entry.isImage = true;
            }
        },
        woff: {
            type: 'webfont',
            mimes: ['application/x-font-woff', 'application/font-woff', 'font/woff'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
                entry.isWoff = true;
            }
        },
        woff2: {
            type: 'webfont',
            mimes: ['font/woff2', 'application/x-font-woff2', 'application/font-woff2'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
                entry.isWoff2 = true;
            }
        },
        otf: {
            type: 'webfont',
            mimes: ['application/x-font-otf', 'font/otf', 'font/opentype', 'application/x-font-opentype'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
            }
        },
        ttf: {
            type: 'webfont',
            mimes: ['application/x-font-ttf', 'font/ttf', 'application/x-font-truetype'],
            updateFn: function(entry) {
                entry.type = 'webfont';
                entry.isWebFont = true;
                entry.isTTF = true;
            }
        },
        eot: {
            type: 'webfont',
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