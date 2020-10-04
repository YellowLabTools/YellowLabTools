var debug       = require('debug')('ylt:screenshotHandler');
var Jimp        = require('jimp');
var Q           = require('q');
var fs          = require('fs');
var path        = require('path');


var screenshotHandler = function() {

    var tmpFolderPath = 'tmp';
    var tmpFolderFullPath = path.join(__dirname, '..', tmpFolderPath);
    var tmpFileName = 'temp-screenshot.png';
    var tmpFileFullPath = path.join(tmpFolderFullPath, tmpFileName);


    this.findAndOptimizeScreenshot = function(width) {
        var that = this;

        debug('Starting screenshot transformation');

        return this.openImage(tmpFileFullPath)

            .then(function(image) {
                that.deleteTmpFile(tmpFileFullPath);
                return that.resizeImage(image, width);
            })

            .then(this.addWhiteBackground)

            .then(this.toBuffer);
    };


    this.openImage = function(imagePath) {
        var deferred = Q.defer();

        Jimp.read(imagePath, function(err, image){
            if (err) {
                debug('Could not open imagePath %s', imagePath);
                debug(err);

                deferred.reject(err);
            } else {
                debug('Image correctly open');
                deferred.resolve(image);
            }
        });

        return deferred.promise;
    };


    this.resizeImage = function(image, newWidth) {
        var deferred = Q.defer();

        var currentWidth = image.bitmap.width;
        var ratio = newWidth / currentWidth;

        image.scale(ratio, function(err, image){
            if (err) {
                debug('Could not resize image');
                debug(err);

                deferred.reject(err);
            } else {
                debug('Image correctly resized');
                deferred.resolve(image);
            }
        });

        return deferred.promise;        
    };

    // If the page doesn't set a bg color, the default PhantomJS one is transparent
    // When transforming PNG to JPG, transparent pixels become black.
    // This is why we need to add a transparent background.
    this.addWhiteBackground = function(image) {
        var deferred = Q.defer();

        // Create a canvas with the same dimensions as your image:
        new Jimp(image.bitmap.width, image.bitmap.height, 0xFFFFFF, function(err, canvas){
            if (err) {
                debug('Could not create a white canvas');
                debug(err);

                deferred.reject(err);
            } else {
                // Paste original image on top of the canvas
                canvas.composite(image, 0, 0, function(err, image){
                    if (err) {
                        debug('Could not paste image on the white canvas');
                        debug(err);

                        deferred.reject(err);
                    } else {
                        // Now image has a white background...
                        debug('White background correctly added');
                        deferred.resolve(image);
                    }
                });
            }
        });

        return deferred.promise;
    };


    this.toBuffer = function(image) {
        var deferred = Q.defer();

        image.quality(90).getBuffer(Jimp.MIME_JPEG, function(err, buffer){
            if (err) {
                debug('Could not save image to buffer');
                debug(err);

                deferred.reject(err);
            } else {
                debug('Image correctly transformed to buffer');
                deferred.resolve(buffer);
            }
        });

        return deferred.promise;
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

    // Create a /tmp folder on the project's root directory
    this.createTmpScreenshotFolder = function() {
        var deferred = Q.defer();

        // Create the folder if it doesn't exist
        fs.exists(tmpFolderFullPath, function(exists) {
            if (exists) {
                deferred.resolve();
            } else {
                debug('Creating the tmp image folder', tmpFolderFullPath);
                fs.mkdir(tmpFolderFullPath, function(err) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                });
            }
        });

        return deferred.promise;
    };

    this.getTmpFileRelativePath = function() {
        return tmpFolderPath + '/' + tmpFileName;
    };
};

module.exports = new screenshotHandler();
