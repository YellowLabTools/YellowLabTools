var debug       = require('debug')('ylt:contentTypeChecker');
var Q           = require('q');
var FileType    = require('file-type');
var isSvg       = require('is-svg');
var isJson      = require('is-json');

var ContentTypeChecker = function() {

    async function checkContentType(entry) {
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
                foundType = await findContentType(entry.weightCheck.bodyBuffer);

                // If it's an image or a font, then rewrite.
                if (foundType !== null && (foundType.type === 'image' || foundType.type === 'webfont' || foundType.type === 'json')) {
                    if (foundType.type !== entry.type) {
                        debug('Content type %s is wrong for %s. It should be %s.', entry.type, entry.ulr, foundType.type);
                    }
                    rewriteContentType(entry, foundType);
                }

            } catch(err) {
                debug('Error while analyzing the contentType of %s', entry.url);
                debug(err);
            }
        }

        deferred.resolve(entry);

        return deferred.promise;
    }

    async function findContentType(bodyBuffer) {
        var bodyStr = bodyBuffer.toString();

        // https://github.com/sindresorhus/is-svg/issues/7
        if (/<svg/.test(bodyStr) && isSvg(bodyStr)) {
            return contentTypes.svg;
        }

        if (isJson(bodyStr)) {
            return contentTypes.json;
        }

        const type = await FileType.fromBuffer(bodyBuffer);
        if (type && type.ext && contentTypes[type.ext]) {
            return contentTypes[type.ext];
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
        jpg: {
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
        avif: {
            type: 'image',
            mimes: ['image/avif'],
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
        },
        json: {
            type: 'json',
            mimes: ['application/json'],
            updateFn: function(entry) {
                entry.type = 'json';
                entry.isJSON = true;
            }
        },
        
    };
    
    return {
        checkContentType: checkContentType,
        findContentType: findContentType
    };
};

module.exports = new ContentTypeChecker();