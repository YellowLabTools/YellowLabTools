var should = require('chai').should();
var runsDatastore = require('../../lib/server/datastores/runsDatastore');

describe('runsDatastore', function() {
    
    var datastore = new runsDatastore();

    var firstRunId = 333;
    var secondRunId = 999;

    it('should accept new runs', function() {
        datastore.should.have.a.property('add').that.is.a('function');

        datastore.add({
            runId: firstRunId,
            otherData: 123456789
        }, 0);

        datastore.add({
            runId: secondRunId,
            otherData: 'whatever'
        }, 1);
    });

    it('should have stored the runs with a status "runnung"', function() {
        datastore.should.have.a.property('get').that.is.a('function');

        var firstRun = datastore.get(firstRunId);
        firstRun.should.have.a.property('runId').that.equals(firstRunId);
        firstRun.should.have.a.property('status').that.deep.equals({
            statusCode: 'running'
        });

        var secondRun = datastore.get(secondRunId);
        secondRun.should.have.a.property('runId').that.equals(secondRunId);
        secondRun.should.have.a.property('status').that.deep.equals({
            statusCode: 'awaiting',
            position: 1
        });

    });

    it('should have exactly 2 runs in the store', function() {
        var runs = datastore.list();
        runs.should.be.a('array');
        runs.should.have.length(2);
        runs[0].should.have.a.property('runId').that.equals(firstRunId);
    });

    it('shoud update statuses correctly', function() {
        
        datastore.markAsComplete(firstRunId);
        var firstRun = datastore.get(firstRunId);
        firstRun.should.have.a.property('status').that.deep.equals({
            statusCode: 'complete'
        });

        datastore.updatePosition(secondRunId, 0);
        var secondRun = datastore.get(secondRunId);
        secondRun.should.have.a.property('status').that.deep.equals({
            statusCode: 'running'
        });

        datastore.markAsFailed(secondRunId, 'Error message');
        secondRun = datastore.get(secondRunId);
        secondRun.should.have.a.property('status').that.deep.equals({
            statusCode: 'failed',
            error: 'Error message'
        });

    });

    it('should delete a run', function() {
        datastore.delete(firstRunId);

        var runs = datastore.list();
        runs.should.be.a('array');
        runs.should.have.length(1);

        runs[0].should.have.a.property('runId').that.equals(secondRunId);
    });
});
