var should = require('chai').should();
var scoreCalculator = require('../../lib/scoreCalculator');

describe('scoreCalculator', function() {
    
    it('should have a method calculate', function() {
        scoreCalculator.should.have.property('calculate').that.is.a('function');
    });
    
    it('should produce a nice rules object', function() {
        var data = require('../fixtures/scoreInput.json');
        var profile = require('../fixtures/scoreProfile.json');
        var expected = require('../fixtures/scoreOutput.json');

        var results = scoreCalculator.calculate(data, profile);
        results.should.deep.equals(expected);
    });
});
