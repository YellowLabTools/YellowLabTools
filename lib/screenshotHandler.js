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

        if (currentWidth > 0) {
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
        } else {
            deferred.reject('Could not resize an empty image');
        }

        return deferred.promise;        
    };


    this.toBuffer = function(image) {
        var deferred = Q.defer();

        image.quality(85).getBuffer(Jimp.MIME_JPEG, function(err, buffer){
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

    this.getTmpFileRelativePath = function() {
        return tmpFolderPath + '/' + tmpFileName;
    };
};

module.exports = new screenshotHandler();
