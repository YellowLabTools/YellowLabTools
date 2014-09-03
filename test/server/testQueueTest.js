var should = require('chai').should();
var testQueue = require('../../app/lib/testQueue.js');

describe('testQueue', function() {
    
    it('should have a method push', function() {
        testQueue.should.have.property('push').that.is.a('function');
        
    });

});