var should = require('chai').should();
var rulesChecker = require('../../lib/rulesChecker');

describe('rulesChecker', function() {
    
    it('should have a method check', function() {
        rulesChecker.should.have.property('check').that.is.a('function');
    });
    
    it('should produce a nice rules object', function(done) {
        var data = require('../fixtures/rulesCheckerInput.json');
        var policies = require('../fixtures/rulesCheckerPolicies.json');
        var expected = require('../fixtures/rulesCheckerOutput.json');

        var checker = rulesChecker.check(data, policies);

        checker.then(function(results) {
            try {
                results.should.deep.equals(expected);
                done();
            } catch(e) {
                done(e);
            }
        });

        checker.fail(function(err) {
            done(err);
        });
    });
});
