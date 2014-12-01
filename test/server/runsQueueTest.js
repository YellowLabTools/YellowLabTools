var should = require('chai').should();
var runsQueue = require('../../lib/server/datastores/runsQueue.js');

describe('runsQueue', function() {

    var queue = new runsQueue();
    var cccRun = null;

    it('should accept a new runId', function(done) {
        queue.should.have.a.property('push').that.is.a('function');

        var aaaRun = queue.push('aaa');
        queue.push('bbb');

        aaaRun.then(function() {
            done();
        });
    });

    it('should return the right positions', function() {
        var aaaPosition = queue.getPosition('aaa');
        aaaPosition.should.equal(0);

        var bbbPosition = queue.getPosition('bbb');
        bbbPosition.should.equal(1);

        var cccPosition = queue.getPosition('ccc');
        cccPosition.should.equal(-1);
    });

    it('should refresh runs\' positions', function(done) {
        cccRun = queue.push('ccc');

        cccRun.progress(function(position) {
            position.should.equal(1);

            var positionDoubleCheck = queue.getPosition('ccc');
            positionDoubleCheck.should.equal(1);

            done();
        });

        queue.remove('aaa');
    });

    it('should fulfill the promise when first in the line', function(done) {
        cccRun.then(function() {
            done();
        });

        queue.remove('bbb');
    });

    it('should not keep removed runs', function() {
        var aaaPosition = queue.getPosition('aaa');
        aaaPosition.should.equal(-1);

        var bbbPosition = queue.getPosition('bbb');
        bbbPosition.should.equal(-1);

        var cccPosition = queue.getPosition('ccc');
        cccPosition.should.equal(0);
    });
});