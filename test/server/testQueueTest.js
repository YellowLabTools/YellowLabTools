var should = require('chai').should();
var testQueue = require('../../app/lib/testQueue.js');

describe('testQueue', function() {
    
    var url = 'http://www.not.existing';

    it('should accept a new test with method push', function() {
        testQueue.should.have.property('push').that.is.a('function');

        var task = {
            testId: 'aaaaa',
            url: url,
            options: {}
        };

        testQueue.push(task, function(err, json, results) {
            done();
        });

    });

});