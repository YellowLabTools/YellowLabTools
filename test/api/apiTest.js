var should      = require('chai').should();
var request     = require('request');
var Q           = require('q');

var config = {
    "authorizedKeys": {
        "1234567890": "contact@gaelmetais.com"
    }
};

var apiUrl = 'http://localhost:8387/api';
var wwwUrl = 'http://localhost:8388';

describe('api', function() {

    var runId;
    var apiServer;

    before(function(done) {
        apiServer = require('../../bin/server.js');
        apiServer.startTests = done;
    });

    it('should refuse a query with an invalid key', function(done) {
        this.timeout(5000);

        request({
            method: 'POST',
            url: apiUrl + '/runs',
            body: {
                url: wwwUrl + '/simple-page.html',
                waitForResponse: false
            },
            json: true,
            headers: {
                'X-Api-Key': 'invalid'
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 401) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should accept a query with a valid key', function(done) {
        this.timeout(5000);

        request({
            method: 'POST',
            url: apiUrl + '/runs',
            body: {
                url: wwwUrl + '/simple-page.html',
                waitForResponse: false
            },
            json: true,
            headers: {
                'X-Api-Key': Object.keys(config.authorizedKeys)[0]
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                runId = body.runId;
                runId.should.be.a('string');
                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should accept up to 10 anonymous runs to the API', function(done) {
        this.timeout(5000);

        function launchRun() {
            var deferred = Q.defer();

            request({
                method: 'POST',
                url: apiUrl + '/runs',
                body: {
                    url: wwwUrl + '/simple-page.html',
                    waitForResponse: false
                },
                json: true
            }, function(error, response, body) {
                if (error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(response, body);
                }
            });

            return deferred.promise;
        }

        launchRun()
        .then(launchRun)
        .then(launchRun)
        .then(launchRun)
        .then(launchRun)

        .then(function(response, body) {
            
            // Here should still be ok
            response.statusCode.should.equal(200);

            launchRun()
            .then(launchRun)
            .then(launchRun)
            .then(launchRun)
            .then(launchRun)
            .then(launchRun)

            .then(function(response, body) {

                // It should fail now
                response.statusCode.should.equal(429);
                done();

            })
            .fail(function(error) {
                done(error);
            });

        }).fail(function(error) {
            done(error);
        });
        
    });

    after(function() {
        console.log('Closing the server');
        apiServer.close();
    });
});
