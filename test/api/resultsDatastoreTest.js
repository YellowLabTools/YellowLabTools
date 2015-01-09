var should = require('chai').should();
var resultsDatastore = require('../../lib/server/datastores/resultsDatastore');

describe('resultsDatastore', function() {
    
    var datastore = new resultsDatastore();
    
    var testId1 = '123456789';
    var testData1 = {
        runId: testId1,
        other: {
            foo: 'foo',
            bar: 1
        }
    };


    it('should store a result', function(done) {
        datastore.should.have.a.property('saveResult').that.is.a('function');

        datastore.saveResult(testData1).then(function() {
            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should store another result', function(done) {
        var testData2 = {
            runId: '987654321',
            other: {
                foo: 'foo',
                bar: 2
            }
        };

        datastore.saveResult(testData2).then(function() {
            done();
        }).fail(function(err) {
            done(err);
        });
    });

    it('should retrieve a result', function(done) {
        datastore.getResult(testId1)
            .then(function(results) {

                // Compare results with testData
                results.should.deep.equal(testData1);

                done();
            }).fail(function(err) {
                done(err);
            });
    });

    it('should delete a result', function(done) {
        datastore.deleteResult(testId1)
            .then(function() {
                done();
            }).fail(function(err) {
                done(err);
            });
    });

    it('should not find the result anymore', function(done) {
        datastore.getResult(testId1)
            .then(function(results) {
                done('Error, the result is still in the datastore');
            }).fail(function(err) {
                done();
            });
    });
});
