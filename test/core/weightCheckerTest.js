var should = require('chai').should();
var weightChecker = require('../../lib/tools/weightChecker');

describe('weightChecker', function() {
    
    it('should download a list of files', function(done) {
        var requestsList = [
            {
                method: 'GET',
                url: 'http://localhost:8388/simple-page.html',
                requestHeaders: {
                    'User-Agent': 'something',
                   Referer: 'http://www.google.fr/',
                   Accept: '*/*'
                },
                status: 200,
                isHTML: true
            },
            {
                method: 'GET',
                url: 'http://localhost:8388/jquery1.8.3.js',
                requestHeaders: {
                    'User-Agent': 'something',
                   Referer: 'http://www.google.fr/',
                   Accept: '*/*'
                },
                status: 200,
                isJS: true
            }
        ];

        var data = {
            toolsResults: {
                phantomas: {
                    metrics: {
                        requestsList: true
                    },
                    offenders: {
                        requestsList: JSON.stringify(requestsList)
                    }
                }
            }
        };

        weightChecker.recheckAllFiles(data)

        .then(function(data) {
            data.toolsResults.should.have.a.property('weightChecker');
            data.toolsResults.weightChecker.should.have.a.property('metrics');
            data.toolsResults.weightChecker.should.have.a.property('offenders');
            done();
        })

        .fail(function(err) {
            done(err);
        });
    });

    it('should download a file and measure its size', function(done) {
        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/jquery1.8.3.js',
            requestHeaders: {
                'User-Agent': 'something',
               Referer: 'http://www.google.fr/',
               Accept: '*/*'
            },
            status: 200,
            isJS: true
        };

        weightChecker.redownloadEntry(entry, function(err, newEntry) {
            should.not.exist(err);

            newEntry.weightCheck.bodySize.should.equal(93636);
            newEntry.weightCheck.uncompressedSize.should.equal(newEntry.weightCheck.bodySize);
            newEntry.weightCheck.isCompressed.should.equal(false);
            newEntry.weightCheck.headersSize.should.be.above(200).and.below(400);
            newEntry.weightCheck.body.should.have.string('1.8.3');

            done();
        });
    });

    it('should fail downloading a file in error', function(done) {
        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/no-file',
            requestHeaders: {
                'User-Agent': 'something',
               Referer: 'http://www.google.fr/',
               Accept: '*/*'
            },
            status: 200,
            isHTML: true,
            contentLength: 999
        };

        weightChecker.redownloadEntry(entry, function(err, newEntry) {
            should.not.exist(err);

            newEntry.weightCheck.should.have.a.property('message').that.equals('error while downloading: 404');

            done();
        });
    });

    it('should not download a non 200 request', function(done) {
        var entry = {
            method: 'GET',
            url: 'http://localhost:8388/no-file',
            requestHeaders: {
                'User-Agent': 'something',
               Referer: 'http://www.google.fr/',
               Accept: '*/*'
            },
            status: 302,
            isHTML: true,
            contentLength: 999
        };

        weightChecker.redownloadEntry(entry, function(err, newEntry) {
            should.not.exist(err);

            newEntry.weightCheck.should.have.a.property('message').that.equals('only downloading requests with status code 200');

            done();
        });
    });

    it('should listRequestWeight', function() {
        var totalWeightObj = weightChecker.listRequestWeight([{
            method: 'GET',
            url: 'http://localhost:8388/jquery1.8.3.js',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isHTML: true,
            type: 'html',
            contentLength: 999,
            weightCheck: {
                body: 'blabla',
                headersSize: 200,
                bodySize: 500,
                isCompressed: false,
                uncompressedSize: 500
            }
        }]);

        totalWeightObj.totalWeight.should.equal(700);
        totalWeightObj.byType.html.totalWeight.should.equal(700);
        totalWeightObj.byType.html.requests.should.have.length(1);
        totalWeightObj.byType.html.requests[0].should.have.a.property('url').that.equals('http://localhost:8388/jquery1.8.3.js');
        totalWeightObj.byType.html.requests[0].should.have.a.property('weight').that.equals(700);
    });

    it('should listRequestWeight even if download failed', function() {
        var totalWeightObj = weightChecker.listRequestWeight([{
            method: 'GET',
            url: 'http://localhost:8388/jquery1.8.3.js',
            requestHeaders: {
                'User-Agent': 'something',
                Referer: 'http://www.google.fr/',
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate'
            },
            status: 200,
            isHTML: true,
            type: 'html',
            contentLength: 999,
            weightCheck: {
                message: 'error while downloading: 404'
            }
        }]);

        totalWeightObj.totalWeight.should.equal(999);
    });

});
