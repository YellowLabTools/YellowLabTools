var debug       = require('debug')('ylt:screenshotHandler');
var sharp       = require('sharp');
var Q           = require('q');
var fs          = require('fs');
var path        = require('path');

// Disable sharp cache to reduce the "disk is full" error on Amazon Lambda
sharp.cache(false);

var screenshotHandler = function() {

    this.findAndOptimizeScreenshot = async function(tmpScreenshotPath, width) {
        return sharp(tmpScreenshotPath)
            .resize({width: 600})
            .jpeg({quality: 85})
            .toBuffer();
    };


    this.deleteTmpFile = function(tmpFilePath) {
        var deferred = Q.defer();

        fs.unlink(tmpFilePath, function (err) {
            if (err) {
                debug('Screenshot temporary file not found, could not be deleted. But it is not a problem.');
            } else {
                debug('Screenshot temporary file deleted.');
            }

            deferred.resolve();
        });

        return deferred.promise;
    };
};

module.exports = new screenshotHandler();
