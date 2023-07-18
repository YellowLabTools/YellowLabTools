var chai                = require('chai');
var sinon               = require('sinon');
var sinonChai           = require('sinon-chai');
var should              = chai.should();
var path                = require('path');
var fs                  = require('fs');
var ylt                 = require('../../lib/index');

chai.use(sinonChai);


describe('index.js', function() {

    it('should return a promise', function() {
        /*var promise = ylt();

        promise.should.have.property('then').that.is.a('function');
        promise.should.have.property('fail').that.is.a('function');*/
    });

    it('should fail with an undefined url', function(done) {
        ylt().fail(function(err) {
            err.should.be.a('string').that.equals('URL missing');
            done();
        });
    });

    it('should fail with an empty url string', function(done) {
        ylt('').fail(function(err) {
            err.should.be.a('string').that.equals('URL missing');
            done();
        });
    });

    it('should succeed on simple-page.html', function(done) {
        this.timeout(15000);

        // Check if console.log is called
        sinon.spy(console, 'log');

        var url = 'http://localhost:8388/simple-page.html';

        ylt(url)
            .then(function(data) {

                data.should.be.an('object');
                data.toolsResults.should.be.an('object');
                
                // Test Phantomas
                data.toolsResults.phantomas.should.be.an('object');
                data.toolsResults.phantomas.should.have.a.property('url').that.equals(url);
                data.toolsResults.phantomas.should.have.a.property('metrics').that.is.an('object');
                data.toolsResults.phantomas.metrics.should.have.a.property('requests').that.equals(2);
                data.toolsResults.phantomas.should.have.a.property('offenders').that.is.an('object');
                data.toolsResults.phantomas.offenders.should.have.a.property('DOMelementMaxDepth');
                data.toolsResults.phantomas.offenders.DOMelementMaxDepth.should.have.length(2);
                data.toolsResults.phantomas.offenders.DOMelementMaxDepth[0].should.equal('body > h1[0]');
                data.toolsResults.phantomas.offenders.DOMelementMaxDepth[1].should.equal('body > script[1]');

                // Test rules
                data.should.have.a.property('rules').that.is.an('object');

                data.rules.should.have.a.property('DOMelementMaxDepth').that.is.an('object');
                data.rules.DOMelementMaxDepth.should.deep.equal({
                    policy: {
                        "tool": "phantomas",
                        "label": "DOM max depth",
                        "message": "<p>A deep DOM makes the CSS matching with DOM elements difficult.</p><p>It also slows down JavaScript modifications to the DOM because changing the dimensions of an element makes the browser re-calculate the dimensions of it's parents. Same thing for JavaScript events, that bubble up to the document root.</p>",
                        "isOkThreshold": 15,
                        "isBadThreshold": 25,
                        "isAbnormalThreshold": 32,
                        "hasOffenders": true
                    },
                    "value": 1,
                    "bad": false,
                    "globalScoreIfFixed": 98,
                    "abnormal": false,
                    "score": 100,
                    "abnormalityScore": 0,
                    "offendersObj": {
                        "count": 2,
                        "tree": {
                            "body": {
                                "h1[0]": 1,
                                "script[1]": 1
                            }
                        }
                    }
                });

                /*jshint expr: true*/
                console.log.should.not.have.been.called;

                //console.log.restore();
                done();
            }).fail(function(err) {
                //console.log.restore();
                done(err);
            });
    });

    it('should succeed on try-catch.html', function(done) {
        this.timeout(15000);

        var url = 'http://localhost:8388/try-catch.html';

        ylt(url)
            .then(function(data) {
                console.log(data.toolsResults.phantomas.offenders.jsErrors);
                data.toolsResults.phantomas.metrics.should.have.a.property('jsErrors').that.equals(0);
                done();
            }).fail(function(err) {
                console.log.restore();
                done(err);
            });
    });

    it('should take a screenshot', function(done) {
        this.timeout(15000);

        var url = 'http://localhost:8388/simple-page.html';
        var screenshotPath = path.join(__dirname, '../../.tmp/indexTestScreenshot.png');

        if (!fs.existsSync(path.join(__dirname, '../../.tmp'))){
            fs.mkdirSync(path.join(__dirname, '../../.tmp'));
        }

        ylt(url, {screenshot: screenshotPath})
            .then(function(data) {

                data.params.options.should.have.a.property('screenshot').that.equals(screenshotPath);
                data.should.not.have.a.property('screenshotUrl');

                fs.existsSync(screenshotPath).should.equal(true);

                done();
            }).fail(function(err) {
                done(err);
            }).finally(function() {

            });
    });

});