var should = require('chai').should();
var phantomasWrapper = require('../../app/lib/phantomasWrapper.js');

describe('phantomasWrapper', function() {
    
    it('should have a method execute', function() {
        phantomasWrapper.should.have.property('execute').that.is.a('function');
    });
    
    it('should execute', function(done) {
        var url = 'http://www.google.fr/';

        this.timeout(15000);
        phantomasWrapper.execute({
            url: url,
            testId: '123abc',
            options:{

            }
        }, function(err, json, results) {
            should.not.exist(err);
            
            json.should.be.an('object');
            json.should.have.a.property('generator');
            json.generator.should.contain('phantomas');
            json.should.have.a.property('url').that.equals(url);
            json.should.have.a.property('metrics').that.is.an('object').not.empty;
            json.should.have.a.property('offenders').that.is.an('object').not.empty;
            json.offenders.should.have.a.property('javascriptExecutionTree').that.is.a('array').not.empty;

            done();
        });
    });

    it('should fail with error 254', function(done) {
        var url = 'http://www.not.existing';

        this.timeout(15000);
        phantomasWrapper.execute({
            url: url,
            testId: '123abc',
            options:{

            }
        }, function(err, json, results) {
            should.exist(err);
            err.should.equal(254);
            should.not.exist(json);

            done();
        });
    });
});