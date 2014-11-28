var should = require('chai').should();
var phantomasWrapper = require('../../lib/tools/phantomasWrapper');

describe('phantomasWrapper', function() {
    
    it('should have a method execute', function() {
        phantomasWrapper.should.have.property('execute').that.is.a('function');
    });
    
    it('should execute', function(done) {
        var url = 'http://localhost:8388/simple-page.html';

        this.timeout(15000);

        phantomasWrapper.execute({
            url: url,
            options: {}
        }).then(function(json) {
            json.should.be.an('object');
            json.should.have.a.property('generator');
            json.generator.should.contain('phantomas');
            json.should.have.a.property('url').that.equals(url);
            json.should.have.a.property('metrics').that.is.an('object').not.empty;
            json.should.have.a.property('offenders').that.is.an('object').not.empty;
            json.offenders.should.have.a.property('javascriptExecutionTree').that.is.a('array').not.empty;

            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should fail with error 254', function(done) {
        var url = 'http://localhost:8389/not-existing.html';

        this.timeout(15000);

        phantomasWrapper.execute({
            url: url,
            options: {}
        }).then(function(json) {

            done('Error: unwanted success');

        }).fail(function(err) {

            should.exist(err);
            err.should.equal(254);

            done();
        });
    });

    it('should timeout but return some results', function(done) {
        var url = 'http://localhost:8388/simple-page.html';

        this.timeout(5000);
        phantomasWrapper.execute({
            url: url,
            options: {
                timeout: 1
            }
        }).then(function(json) {
            
            json.should.be.an('object');
            json.should.have.a.property('generator');
            json.generator.should.contain('phantomas');
            json.should.have.a.property('url').that.equals(url);
            json.should.have.a.property('metrics').that.is.an('object').not.empty;
            json.should.have.a.property('offenders').that.is.an('object').not.empty;
            json.offenders.should.have.a.property('javascriptExecutionTree').that.is.a('array').not.empty;

            done();
        }).fail(function(err) {
            done(err);
        });
    });
});