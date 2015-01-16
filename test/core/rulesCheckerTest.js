var should = require('chai').should();
var rulesChecker = require('../../lib/rulesChecker');

describe('rulesChecker', function() {
    
    it('should have a method check', function() {
        rulesChecker.should.have.property('check').that.is.a('function');
    });
    
    it('should produce a nice rules object', function() {
        var data = require('../fixtures/rulesCheckerInput.json');
        var policies = require('../fixtures/rulesCheckerPolicies');
        var expected = require('../fixtures/rulesCheckerOutput.json');

        var results = rulesChecker.check(data, policies);
        results.should.deep.equals(expected);
    });
});
