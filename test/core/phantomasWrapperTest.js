var should = require('chai').should();
var phantomasWrapper = require('../../lib/tools/phantomas/phantomasWrapper');

describe('phantomasWrapper', function() {
    
    it('should have a method execute', function() {
        phantomasWrapper.should.have.property('execute').that.is.a('function');
    });
    
    it('should execute', function(done) {
        var url = 'http://localhost:8388/simple-page.html';

        this.timeout(15000);

        phantomasWrapper.execute({
            params: {
                url: url,
                options: {}
            }
        }).then(function(data) {
            /*jshint -W030 */

            data.should.be.an('object');
            data.should.have.a.property('generator');
            data.generator.should.contain('phantomas');
            data.should.have.a.property('url').that.equals(url);
            data.should.have.a.property('metrics').that.is.an('object').not.empty;
            data.should.have.a.property('offenders').that.is.an('object').not.empty;
            data.offenders.should.have.a.property('javascriptExecutionTree').that.is.a('array').not.empty;

            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should fail with error 254', function(done) {
        var url = 'http://localhost:8389/not-existing.html';

        this.timeout(15000);

        phantomasWrapper.execute({
            params: {
                url: url,
                options: {
                    device: 'desktop'
                }
            }
        }).then(function(data) {

            done('Error: unwanted success');

        }).fail(function(err) {
            try {
                should.exist(err);
                err.should.equal(254);

                done();
            } catch(error) {
                done(error);
            }
        });
    });

    it('should timeout but return some results', function(done) {
        var url = 'http://localhost:8388/simple-page.html';

        this.timeout(5000);
        phantomasWrapper.execute({
            params: {
                url: url,
                options: {
                    timeout: 1
                }
            }
        }).then(function(data) {
            /*jshint -W030 */

            try {            
                data.should.be.an('object');
                data.should.have.a.property('generator');
                data.generator.should.contain('phantomas');
                data.should.have.a.property('url').that.equals(url);
                data.should.have.a.property('metrics').that.is.an('object').not.empty;
                data.should.have.a.property('offenders').that.is.an('object').not.empty;
                data.offenders.should.have.a.property('javascriptExecutionTree').that.is.a('array').not.empty;

                done();
            } catch(error) {
                done(error);
            }
        }).fail(function(err) {
            done(err);
        });
    });
});