var should = require('chai').should();
var imageReformater = require('../../lib/tools/redownload/imageReformater');
var fs = require('fs');
var path = require('path');

describe('imageReformater', function() {

    it('should convert a JPEG image to WebP and AVIF', async function() {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/jpeg-image.jpg'));
        let entry = {
            isImage: true,
            type: 'image',
            contentType: 'image/jpeg',
            weightCheck: {
                bodyBuffer: fileContent,
                uncompressedSize: fileContent.length
            }
        };

        var newEntry = await imageReformater.reformatImage(entry);

        newEntry.weightCheck.should.have.a.property('webpSize');
        newEntry.weightCheck.webpSize.should.be.below(fileContent.length);

        newEntry.weightCheck.should.have.a.property('avifSize');
        newEntry.weightCheck.avifSize.should.be.below(fileContent.length);
    });

    it('should convert a PNG image to WebP and AVIF', async function() {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/jpeg-image.jpg'));
        let entry = {
            isImage: true,
            type: 'image',
            contentType: 'image/png',
            weightCheck: {
                bodyBuffer: fileContent,
                uncompressedSize: fileContent.length
            }
        };

        var newEntry = await imageReformater.reformatImage(entry);

        newEntry.weightCheck.should.have.a.property('webpSize');
        newEntry.weightCheck.webpSize.should.be.below(fileContent.length);

        newEntry.weightCheck.should.have.a.property('avifSize');
        newEntry.weightCheck.avifSize.should.be.below(fileContent.length);
    });

    it('should convert a WebP image to AVIF', async function() {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/jpeg-image.jpg'));
        let entry = {
            isImage: true,
            type: 'image',
            contentType: 'image/webp',
            weightCheck: {
                bodyBuffer: fileContent,
                uncompressedSize: fileContent.length
            }
        };

        var newEntry = await imageReformater.reformatImage(entry);

        newEntry.weightCheck.should.not.have.a.property('webpSize');

        newEntry.weightCheck.should.have.a.property('avifSize');
        newEntry.weightCheck.avifSize.should.be.below(fileContent.length);
    });

    it('should recognize an animated WebP', async function() {
        // Test on an animated image
        let fileContent = fs.readFileSync(path.resolve(__dirname, '../www/animated.webp'));
        let entry = {
            isImage: true,
            type: 'image',
            contentType: 'image/webp',
            weightCheck: {
                bodyBuffer: fileContent,
                uncompressedSize: fileContent.length
            }
        };

        (await imageReformater.isAnimated(entry)).should.equal(true);

        // Test on a not animated image
        fileContent = fs.readFileSync(path.resolve(__dirname, '../www/monster.webp'));
        entry.weightCheck.bodyBuffer = fileContent;
        (await imageReformater.isAnimated(entry)).should.equal(false);
    });

    it('should not convert an animated WebP', async function() {
        // Test on an animated image
        let fileContent = fs.readFileSync(path.resolve(__dirname, '../www/animated.webp'));
        let entry = {
            isImage: true,
            type: 'image',
            contentType: 'image/webp',
            weightCheck: {
                bodyBuffer: fileContent,
                uncompressedSize: fileContent.length
            }
        };

        var newEntry = await imageReformater.reformatImage(entry);

        // Test on a not animated image
        newEntry.weightCheck.should.not.have.a.property('avifSize');
    });

    it('should determine if gain is enough', function() {
        imageReformater.gainIsEnough(20000, 10000).should.equal(true);
        imageReformater.gainIsEnough(2000, 1000).should.equal(true);
        imageReformater.gainIsEnough(20000, 21000).should.equal(false);
        imageReformater.gainIsEnough(20000, 40000).should.equal(false);
        imageReformater.gainIsEnough(20000, 19500).should.equal(false);
        imageReformater.gainIsEnough(250, 120).should.equal(true);
        imageReformater.gainIsEnough(200, 120).should.equal(false);
        imageReformater.gainIsEnough(2000, 1900).should.equal(false);
        imageReformater.gainIsEnough(200000, 197000).should.equal(true);
    });

});
