var debug       = require('debug')('ylt:imageReformater');
var sharp       = require('sharp');

// Disable sharp cache to reduce the "disk is full" error on Amazon Lambda
sharp.cache(false);

var ImageOptimizer = function() {

    // https://www.industrialempathy.com/posts/avif-webp-quality-settings
    const WEBP_QUALITY = 82;
    const AVIF_QUALITY = 64;

    async function reformatImage(entry) {
        if (!entry.weightCheck || !entry.weightCheck.bodyBuffer) {
            // No valid file available
            return entry;
        }

        var fileSize = entry.weightCheck.uncompressedSize;
        debug('Let\'s try to convert %s to other image formats', entry.url);
        debug('Current file size is %d', fileSize);

        var animated = await isAnimated(entry);
        debug('Check if the file is animated: %s', animated);


        if (isJPEG(entry) || isPNG(entry)) {
            debug('File is %s, let\'s try to convert it to WebP', entry.contentType);

            try {

                const webpFile = await convertToWebp(entry.weightCheck.bodyBuffer, animated);

                if (webpFile) {
                    var webpFileSize = webpFile.length;

                    debug('WebP transformation complete for %s', entry.url);
                    debug('WebP size is %d bytes', webpFileSize);

                    if (webpFile.length > 0 && gainIsEnough(fileSize, webpFileSize)) {
                        entry.weightCheck.webpSize = webpFileSize;
                        debug('WebP size is %d bytes smaller (-%d%)', fileSize - webpFileSize, Math.round((fileSize - webpFileSize) * 100 / fileSize));
                    }

                } else {
                    debug('Convertion to WebP didn\'t work');
                }

            } catch(err) {
                debug('Error while converting to WebP, ignoring');
            }
        }

        if (!animated && (isJPEG(entry) || isPNG(entry) || isWebP(entry))) {
            debug('File is %s and is not animated, let\'s try to convert it to AVIF', entry.contentType);

            try {

                const avifFile = await convertToAvif(entry.weightCheck.bodyBuffer);

                if (avifFile) {
                    var avifFileSize = avifFile.length;

                    debug('AVIF transformation complete for %s', entry.url);
                    debug('AVIF size is %d bytes', avifFileSize);

                    if (avifFile.length > 0 && gainIsEnough(fileSize, avifFileSize)) {
                        entry.weightCheck.avifSize = avifFileSize;
                        debug('AVIF size is %d bytes smaller (-%d%)', fileSize - avifFileSize, Math.round((fileSize - avifFileSize) * 100 / fileSize));
                    }

                } else {
                    debug('Convertion to AVIF didn\'t work');
                }

            } catch(err) {
                debug('Error while converting to AVIF, ignoring');
            }
        }

        return entry;
    }

    async function convertToWebp(bodyBuffer, isAnimated) {
        return sharp(bodyBuffer, {animated: isAnimated})
            .webp({quality: WEBP_QUALITY, alphaQuality: WEBP_QUALITY})
            .toBuffer();
    }

    async function convertToAvif(bodyBuffer) {
        return sharp(bodyBuffer)
            .webp({quality: AVIF_QUALITY})
            .toBuffer();
    }

    // The gain is estimated of enough value if it's over 2KB or over 20%,
    // but it's ignored if is below 100 bytes
    function gainIsEnough(oldWeight, newWeight) {
        var gain = oldWeight - newWeight;
        var ratio = gain / oldWeight;
        return (gain > 2048 || (ratio > 0.2 && gain > 100));
    }

    function isJPEG(entry) {
        return entry.isImage && entry.contentType === 'image/jpeg';
    }

    function isPNG(entry) {
        return entry.isImage && entry.contentType === 'image/png';
    }

    function isWebP(entry) {
        return entry.isImage && entry.contentType === 'image/webp';
    }

    function entryTypeCanBeReformated(entry) {
        return isJPEG(entry) || isPNG(entry) || isWebP(entry);
    }

    async function isAnimated(entry) {
        if (isWebP(entry)) {
            const metadata = await sharp(entry.weightCheck.bodyBuffer).metadata();
            return metadata.pages > 1;
        }
        return false;
    }

    return {
        reformatImage: reformatImage,
        convertToWebp: convertToWebp,
        convertToAvif: convertToAvif,
        gainIsEnough: gainIsEnough,
        entryTypeCanBeReformated: entryTypeCanBeReformated,
        isAnimated: isAnimated
    };
};

module.exports = new ImageOptimizer();