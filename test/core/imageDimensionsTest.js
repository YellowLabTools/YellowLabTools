var should = require('chai').should();
var imageDimensions = require('../../lib/tools/redownload/imageDimensions');
var fs = require('fs');
var path = require('path');

describe('imageDimensions', function() {
    
    it('should detect png image dimensions', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/png-image.png'));

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/an-image.png',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/png',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: 999,
                headersSize: 200,
                bodySize: 999,
                isCompressed: false,
                uncompressedSize: 999
            }
        };

        imageDimensions.getDimensions(entry)

        .then(function(newEntry) {
            newEntry.should.have.a.property('imageDimensions');
            newEntry.imageDimensions.should.have.a.property('width').that.equals(664);
            newEntry.imageDimensions.should.have.a.property('height').that.equals(314);
            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should detect a jpg image dimensions', function(done) {
        var fileContent = fs.readFileSync(path.resolve(__dirname, '../www/jpeg-image.jpg'));

        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/an-image.jpg',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isImage: true,
            type: 'image',
            contentType: 'image/jpeg',
            contentLength: 999,
            weightCheck: {
                bodyBuffer: fileContent,
                totalWeight: 999,
                headersSize: 200,
                bodySize: 999,
                isCompressed: false,
                uncompressedSize: 999
            }
        };

        imageDimensions.getDimensions(entry)

        .then(function(newEntry) {
            newEntry.should.have.a.property('imageDimensions');
            newEntry.imageDimensions.should.have.a.property('width').that.equals(285);
            newEntry.imageDimensions.should.have.a.property('height').that.equals(427);
            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

});
