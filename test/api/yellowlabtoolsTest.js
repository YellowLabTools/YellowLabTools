var should              = require('chai').should();
var YellowLabTools      = require('../../lib/yellowlabtools.js');


describe('yellowlabtools', function() {

    it('returns a promise', function() {
        var ylt = new YellowLabTools();

        ylt.should.have.property('then').that.is.a('function');
        ylt.should.have.property('fail').that.is.a('function');
    });

    it('fails an undefined url', function(done) {
        var ylt = new YellowLabTools().fail(function(err) {
            err.should.be.a('string').that.equals('URL missing');
            done();
        });
    });

    it('fails with an empty url string', function(done) {
        var ylt = new YellowLabTools('').fail(function(err) {
            err.should.be.a('string').that.equals('URL missing');
            done();
        });
    });

    it('succeeds on simple-page.html', function(done) {
        this.timeout(15000);

        var url = 'http://localhost:8388/simple-page.html';

        var ylt = new YellowLabTools(url)
            .then(function(data) {
                data.should.be.an('object');
                data.should.have.a.property('url').that.equals(url);
                
                data.should.have.a.property('metrics').that.is.an('object');
                data.metrics.should.have.a.property('requests').that.equals(1);

                data.should.have.a.property('offenders').that.is.an('object');
                data.offenders.should.have.a.property('DOMelementMaxDepth');
                data.offenders.DOMelementMaxDepth.should.have.length(1);
                data.offenders.DOMelementMaxDepth[0].should.equal('body > h1[1]');

                done();
            }).fail(function(err) {
                done(err);
            });
    });

});