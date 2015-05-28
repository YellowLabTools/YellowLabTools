var debug       = require('debug')('ylt:screenshotHandler');
var lwip        = require('lwip');
var tmp         = require('temporary');
var Q           = require('q');
var fs          = require('fs');
var path        = require('path');


var screenshotHandler = function() {

    this.getScreenshotTempFile = function() {
        
        var screenshotTmpFolder = new tmp.Dir();
        var tmpFilePath = path.join(screenshotTmpFolder.path, 'screenshot.png');
        var that = this;
        
        return {
            
            getTmpFolder: function() {
                return screenshotTmpFolder;
            },
            
            getTmpFilePath: function() {
                return tmpFilePath;
            },
            
            toThumbnail: function(width) {
                return that.optimize(tmpFilePath, width);
            },
            
            deleteTmpFile: function() {
                return that.deleteTmpFileAndFolder(tmpFilePath, screenshotTmpFolder);
            }
        };
    };


    this.optimize = function(imagePath, width) {
        var that = this;

        debug('Starting screenshot transformation');

        return this.openImage(imagePath)

            .then(function(image) {

                return that.resizeImage(image, width);

            })

            .then(this.addWhiteBackground)

            .then(this.toBuffer);
    };


    this.openImage = function(imagePath) {
        var deferred = Q.defer();

        lwip.open(imagePath, function(err, image){
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

        var currentWidth = image.width();
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
        lwip.create(image.width(), image.height(), 'white', function(err, canvas){
            if (err) {
                debug('Could not create a white canvas');
                debug(err);

                deferred.reject(err);
            } else {
                // Paste original image on top of the canvas
                canvas.paste(0, 0, image, function(err, image){
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

        image.toBuffer('jpg', {quality: 90}, function(err, buffer){
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


    this.deleteTmpFileAndFolder = function(tmpFilePath, screenshotTmpFolder) {
        var deferred = Q.defer();

        fs.unlink(tmpFilePath, function (err) {
            if (err) {
                debug('Screenshot file not found, could not be deleted. But it is not a problem.');
            } else {
                debug('Screenshot file deleted.');
            }

            screenshotTmpFolder.rmdir();
            debug('Screenshot temp folder deleted');

            deferred.resolve();
        });

        return deferred.promise;
    };
};

module.exports = new screenshotHandler();