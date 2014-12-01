var should = require('chai').should();
var runsDatastore = require('../../lib/server/datastores/runsDatastore');

describe('runsDatastore', function() {
    
    var datastore = new runsDatastore();

    var randomId = Math.round(Math.random() * 100000);

    it('should accept a new run', function() {
        datastore.should.have.a.property('add').that.is.a('function');

        datastore.add({
            _id: randomId,
            otherData: 123456789
        });
    });

    it('should have stored the run', function() {
        datastore.should.have.a.property('get').that.is.a('function');

        var run = datastore.get(randomId);

        run.should.have.a.property('_id').that.equals(randomId);
    });

    it('should have exactly 1 run in the store', function() {
        var runs = datastore.list();
        runs.should.be.a('array');
        runs.should.have.length(1);
        runs[0].should.have.a.property('_id').that.equals(randomId);
    });

    it('should delete the run', function() {
        datastore.delete(randomId);

        var runs = datastore.list();
        runs.should.be.a('array');
        runs.should.have.length(0);
    });
});
