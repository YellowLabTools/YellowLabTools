var should      = require('chai').should();
var request     = require('request');
var jwt         = require('jwt-simple');

var config = {
    "authorizedKeys": {
        "1234567890": "test@test.com"
    },
    "tokenSalt": "test-salt",
    "authorizedApplications": ["wooot"]
};

var apiUrl = 'http://localhost:8387/api';
var wwwUrl = 'http://localhost:8388';

describe('api', function() {

    var runId;
    
    it('should not accept a query if there is no key in headers', function(done) {
        this.timeout(5000);

        request({
            method: 'POST',
            url: apiUrl + '/runs',
            body: {
                url: wwwUrl + '/simple-page.html',
                waitForResponse: false
            },
            json: true
        }, function(error, response, body) {
            if (!error && response.statusCode === 401) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
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

    it('should refuse an expired token', function(done) {
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
                'X-Api-Token': jwt.encode({
                    application: config.authorizedApplications[0],
                    expire: Date.now() - 60000
                }, config.tokenSalt)
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 401) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should refuse a token from an unknown app', function(done) {
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
                'X-Api-Token': jwt.encode({
                    application: 'unknown-app',
                    expire: Date.now() + 60000
                }, config.tokenSalt)
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 401) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should accept a good token', function(done) {
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
                'X-Api-Token': jwt.encode({
                    application: config.authorizedApplications[0],
                    expire: Date.now() + 60000
                }, config.tokenSalt)
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
});
