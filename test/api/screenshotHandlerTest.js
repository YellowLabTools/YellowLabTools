var should = require('chai').should();
var ScreenshotHandler = require('../../lib/screenshotHandler');

var fs = require('fs');
var path = require('path');

describe('screenshotHandler', function() {

    var imagePath = path.join(__dirname, '../fixtures/logo-large.png');
    var screenshot, lwipImage;

    
    it('should open an image and return an lwip object', function(done) {
        ScreenshotHandler.openImage(imagePath)
            .then(function(image) {
                lwipImage = image;

                lwipImage.should.be.an('object');
                lwipImage.width().should.equal(620);
                lwipImage.height().should.equal(104);

                done();
            })
            .fail(function(err) {
                done(err);
            });
    });

    
    it('should resize an lwip image', function(done) {
        ScreenshotHandler.resizeImage(lwipImage, 310)
            .then(function(image) {
                lwipImage = image;

                lwipImage.width().should.equal(310);
                lwipImage.height().should.equal(52);

                done();
            })
            .fail(function(err) {
                done(err);
            });
    });


    it('should transform a lwip image into a buffer', function(done) {
        ScreenshotHandler.toBuffer(lwipImage)
            .then(function(buffer) {
                buffer.should.be.an.instanceof(Buffer);
                done();
            })
            .fail(function(err) {
                done(err);
            });
    });


    it('should optimize an image and return a buffered version', function(done) {
        ScreenshotHandler.optimize(imagePath, 200)
            .then(function(buffer) {
                buffer.should.be.an.instanceof(Buffer);
                done();
            })
            .fail(function(err) {
                done(err);
            });
    });


    it('should provide a temporary file object', function() {
        screenshot = ScreenshotHandler.getScreenshotTempFile();

        screenshot.should.have.a.property('getTmpFolder').that.is.a('function');
        screenshot.should.have.a.property('getTmpFilePath').that.is.a('function');
        screenshot.should.have.a.property('toThumbnail').that.is.a('function');
        screenshot.should.have.a.property('deleteTmpFile').that.is.a('function');
    });


    it('should have created the temporary folder', function() {
        var folder = screenshot.getTmpFolder();
        fs.existsSync(folder.path).should.equal(true);
    });


    it('should respond a temporary file', function() {
        var file = screenshot.getTmpFilePath();
        file.should.have.string('/screenshot.png');
    });


    it('should delete the temp folder when there is no file', function(done) {
        var tmpFolderPath = screenshot;

        screenshot.deleteTmpFile()
            .delay(1000)
            .then(function() {
                fs.existsSync(screenshot.getTmpFolder().path).should.equal(false);
                done();
            })
            .fail(function(err) {
                done(err);
            });
    });

    it('should delete the temp folder with the screenshot inside', function(done) {
        screenshot = ScreenshotHandler.getScreenshotTempFile();
        var tmpFolderPath = screenshot.getTmpFolder().path;
        var tmpImagePath = path.join(tmpFolderPath, 'screenshot.png');

        // Copy image
        var testImage = fs.readFileSync(imagePath);
        fs.writeFileSync(tmpImagePath, testImage);

        fs.existsSync(tmpImagePath).should.equal(true);

        screenshot.deleteTmpFile()
            .delay(1000)
            .then(function() {
                fs.existsSync(tmpImagePath).should.equal(false);
                fs.existsSync(tmpFolderPath).should.equal(false);
                done();
            })
            .fail(function(err) {
                done(err);
            });
    });
});