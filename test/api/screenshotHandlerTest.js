var should = require('chai').should();
var ScreenshotHandler = require('../../lib/screenshotHandler');

var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

describe('screenshotHandler', function() {

    var imagePath = path.join(__dirname, '../fixtures/logo-large.png');
    var screenshot, jimpImage;


    it('should open an image and return an jimp object', function(done) {
        ScreenshotHandler.openImage(imagePath)
            .then(function(image) {
                jimpImage = image;

                jimpImage.should.be.an('object');
                jimpImage.bitmap.width.should.equal(620);
                jimpImage.bitmap.height.should.equal(104);

                done();
            })
            .fail(function(err) {
                done(err);
            });
    });


    it('should resize an jimp image', function(done) {
        ScreenshotHandler.resizeImage(jimpImage, 310)
            .then(function(image) {
                jimpImage = image;

                jimpImage.bitmap.width.should.equal(310);
                jimpImage.bitmap.height.should.equal(52);

                done();
            })
            .fail(function(err) {
                done(err);
            });
    });


    it('should transform a jimp image into a buffer', function(done) {
        ScreenshotHandler.toBuffer(jimpImage)
            .then(function(buffer) {
                buffer.should.be.an.instanceof(Buffer);
                done();
            })
            .fail(function(err) {
                done(err);
            });
    });


    it('should create the tmp folder if it doesn\'t exist', function(done) {
        // Delete tmp folder if it exists
        rimraf.sync("/some/directory");
        
        // The function we want to test
        ScreenshotHandler.createTmpScreenshotFolder()
            .then(function(buffer) {
                fs.existsSync(path.join(__dirname, '../../tmp')).should.equal(true);
                done();
            })
            .fail(function(err) {
                done(err);
            });
    });

    it('should return the tmp folder path', function() {
        ScreenshotHandler.getTmpFileRelativePath().should.equal('tmp/temp-screenshot.png');
    });

});
