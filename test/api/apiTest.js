var should      = require('chai').should();
var request     = require('request');
var Q           = require('q');

var config = {
    "authorizedKeys": {
        "1234567890": "contact@gaelmetais.com"
    }
};

var serverUrl = 'http://localhost:8387';
var wwwUrl = 'http://localhost:8388';

describe('api', function() {


    var syncRunResultUrl;
    var asyncRunId;
    var screenshotUrl;


    it('should refuse a query with an invalid key', function(done) {
        this.timeout(5000);

        request({
            method: 'POST',
            url: serverUrl + '/api/runs',
            body: {
                url: wwwUrl + '/simple-page.html',
                waitForResponse: false
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
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

    it('should fail without an URL when asynchronous', function(done) {
        this.timeout(15000);

        request({
            method: 'POST',
            url: serverUrl + '/api/runs',
            body: {
                url: '',
                waitForResponse: true
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': Object.keys(config.authorizedKeys)[0]
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 400) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should fail without an URL when synchronous', function(done) {
        this.timeout(15000);

        request({
            method: 'POST',
            url: serverUrl + '/api/runs',
            body: {
                url: '',
                waitForResponse: true
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': Object.keys(config.authorizedKeys)[0]
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 400) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should launch a synchronous run', function(done) {
        this.timeout(15000);

        request({
            method: 'POST',
            url: serverUrl + '/api/runs',
            body: {
                url: wwwUrl + '/simple-page.html',
                waitForResponse: true,
                screenshot: true,
                device: 'tablet',
                //waitForSelector: '*',
                cookie: 'foo=bar;domain=google.com',
                authUser: 'joe',
                authPass: 'secret'
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': Object.keys(config.authorizedKeys)[0]
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 302) {

                response.headers.should.have.a.property('location').that.is.a('string');
                syncRunResultUrl = response.headers.location;

                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should return the rules only', function(done) {
        this.timeout(15000);

        request({
            method: 'POST',
            url: serverUrl + '/api/runs',
            body: {
                url: wwwUrl + '/simple-page.html',
                waitForResponse: true,
                partialResult: 'rules'
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': Object.keys(config.authorizedKeys)[0]
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 302) {

                response.headers.should.have.a.property('location').that.is.a('string');
                response.headers.location.should.contain('/rules');

                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should retrieve the results for the synchronous run', function(done) {
        this.timeout(15000);

        request({
            method: 'GET',
            url: serverUrl + syncRunResultUrl,
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                body.should.have.a.property('runId').that.is.a('string');
                body.should.have.a.property('params').that.is.an('object');
                body.should.have.a.property('scoreProfiles').that.is.an('object');
                body.should.have.a.property('rules').that.is.an('object');
                body.should.have.a.property('toolsResults').that.is.an('object');

                body.should.have.a.property('javascriptExecutionTree').that.is.an('object');
                body.javascriptExecutionTree.should.not.deep.equal({});

                // Check if settings are correctly sent and retrieved
                body.params.options.should.have.a.property('device').that.equals('tablet');
                //body.params.options.should.have.a.property('waitForSelector').that.equals('*');
                body.params.options.should.have.a.property('cookie').that.equals('foo=bar;domain=google.com');
                body.params.options.should.have.a.property('authUser').that.equals('joe');
                body.params.options.should.have.a.property('authPass').that.equals('secret');

                // Check if the screenshot temporary file was correctly removed
                body.params.options.should.not.have.a.property('screenshot');
                // Check if the screenshot buffer was correctly removed
                body.should.not.have.a.property('screenshotBuffer');
                // Check if the screenshot url is here
                body.should.have.a.property('screenshotUrl');
                body.screenshotUrl.should.equal('api/results/' + body.runId + '/screenshot.jpg');

                screenshotUrl = body.screenshotUrl;

                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should launch a run without waiting for the response', function(done) {
        this.timeout(5000);

        request({
            method: 'POST',
            url: serverUrl + '/api/runs',
            body: {
                url: wwwUrl + '/simple-page.html',
                waitForResponse: false,
                jsTimeline: true
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': Object.keys(config.authorizedKeys)[0]
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                asyncRunId = body.runId;
                asyncRunId.should.be.a('string');
                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should respond run status: running', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/runs/' + asyncRunId,
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': Object.keys(config.authorizedKeys)[0]
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                body.runId.should.equal(asyncRunId);
                body.status.should.deep.equal({
                    statusCode: 'running'
                });

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
                url: serverUrl + '/api/runs',
                body: {
                    url: wwwUrl + '/simple-page.html',
                    waitForResponse: false
                },
                json: true
            }, function(error, response, body) {

                lastRunId = body.runId;

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


    it('should respond 404 to unknown runId', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/runs/unknown',
            json: true
        }, function(error, response, body) {
            if (!error && response.statusCode === 404) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should respond 404 to unknown result', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/unknown',
            json: true
        }, function(error, response, body) {
            if (!error && response.statusCode === 404) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

    
    it('should respond status complete to the first run', function(done) {
        this.timeout(12000);

        function checkStatus() {
            request({
                method: 'GET',
                url: serverUrl + '/api/runs/' + asyncRunId,
                json: true
            }, function(error, response, body) {
                if (!error && response.statusCode === 200) {

                    body.runId.should.equal(asyncRunId);
                    
                    if (body.status.statusCode === 'running') {
                        setTimeout(checkStatus, 250);
                    } else if (body.status.statusCode === 'complete') {
                        done();
                    } else {
                        done(body.status.statusCode);
                    }

                } else {
                    done(error || response.statusCode);
                }
            });
        }

        checkStatus();
    });


    it('should find the result of the async run', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId,
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                body.should.have.a.property('runId').that.equals(asyncRunId);
                body.should.have.a.property('params').that.is.an('object');
                body.params.url.should.equal(wwwUrl + '/simple-page.html');

                body.should.have.a.property('scoreProfiles').that.is.an('object');
                body.scoreProfiles.should.have.a.property('generic').that.is.an('object');
                body.scoreProfiles.generic.should.have.a.property('globalScore').that.is.a('number');
                body.scoreProfiles.generic.should.have.a.property('categories').that.is.an('object');

                body.should.have.a.property('rules').that.is.an('object');

                body.should.have.a.property('toolsResults').that.is.an('object');
                body.toolsResults.should.have.a.property('phantomas').that.is.an('object');

                body.should.have.a.property('javascriptExecutionTree').that.is.an('object');
                body.javascriptExecutionTree.should.have.a.property('data').that.is.an('object');
                body.javascriptExecutionTree.data.should.have.a.property('type').that.equals('main');

                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should return the generic score object', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '/generalScores',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                body.should.have.a.property('globalScore').that.is.a('number');
                body.should.have.a.property('categories').that.is.an('object');
                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should return the generic score object also', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '/generalScores/generic',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                body.should.have.a.property('globalScore').that.is.a('number');
                body.should.have.a.property('categories').that.is.an('object');
                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should not find an unknown score object', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '/generalScores/unknown',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 404) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should return the rules', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '/rules',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                
                var firstRule = body[Object.keys(body)[0]];
                firstRule.should.have.a.property('policy').that.is.an('object');
                firstRule.should.have.a.property('value').that.is.a('number');
                firstRule.should.have.a.property('bad').that.is.a('boolean');
                firstRule.should.have.a.property('abnormal').that.is.a('boolean');
                firstRule.should.have.a.property('score').that.is.a('number');
                firstRule.should.have.a.property('abnormalityScore').that.is.a('number');
                
                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should return the javascript execution tree', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '/javascriptExecutionTree',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                
                body.should.have.a.property('data').that.is.an('object');
                body.data.should.have.a.property('type').that.equals('main');
                
                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should return the phantomas results', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '/toolsResults/phantomas',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                
                body.should.have.a.property('metrics').that.is.an('object');
                body.should.have.a.property('offenders').that.is.an('object');
                
                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should return the entire object and exclude toolsResults', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '?exclude=toolsResults',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                
                body.should.have.a.property('runId').that.equals(asyncRunId);
                body.should.have.a.property('params').that.is.an('object');
                body.should.have.a.property('scoreProfiles').that.is.an('object');
                body.should.have.a.property('rules').that.is.an('object');
                body.should.have.a.property('javascriptExecutionTree').that.is.an('object');
                
                body.should.not.have.a.property('toolsResults').that.is.an('object');

                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should return the entire object and exclude params and toolsResults', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '?exclude=toolsResults,params',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                
                body.should.have.a.property('runId').that.equals(asyncRunId);
                body.should.have.a.property('scoreProfiles').that.is.an('object');
                body.should.have.a.property('rules').that.is.an('object');
                body.should.have.a.property('javascriptExecutionTree').that.is.an('object');
                
                body.should.not.have.a.property('params').that.is.an('object');
                body.should.not.have.a.property('toolsResults').that.is.an('object');

                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should return the entire object and don\'t exclude anything', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '?exclude=',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                
                body.should.have.a.property('runId').that.equals(asyncRunId);
                body.should.have.a.property('scoreProfiles').that.is.an('object');
                body.should.have.a.property('rules').that.is.an('object');
                body.should.have.a.property('javascriptExecutionTree').that.is.an('object');
                body.should.have.a.property('params').that.is.an('object');
                body.should.have.a.property('toolsResults').that.is.an('object');

                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should return the entire object and don\'t exclude anything', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/' + asyncRunId + '?exclude=null',
            json: true,
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                
                body.should.have.a.property('runId').that.equals(asyncRunId);
                body.should.have.a.property('scoreProfiles').that.is.an('object');
                body.should.have.a.property('rules').that.is.an('object');
                body.should.have.a.property('javascriptExecutionTree').that.is.an('object');
                body.should.have.a.property('params').that.is.an('object');
                body.should.have.a.property('toolsResults').that.is.an('object');

                done();

            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should retrieve the screenshot', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/' + screenshotUrl
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                response.headers['content-type'].should.equal('image/jpeg');
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });


    it('should fail on a unexistant screenshot', function(done) {
        this.timeout(5000);

        request({
            method: 'GET',
            url: serverUrl + '/api/results/000000/screenshot.jpg'
        }, function(error, response, body) {
            if (!error && response.statusCode === 404) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

    it('should refuse a query on a blocked Url', function(done) {
        this.timeout(5000);

        request({
            method: 'POST',
            url: serverUrl + '/api/runs',
            body: {
                url: 'http://www.test.com/something.html',
                waitForResponse: false
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': Object.keys(config.authorizedKeys)[0]
            }
        }, function(error, response, body) {
            if (!error && response.statusCode === 403) {
                done();
            } else {
                done(error || response.statusCode);
            }
        });
    });

});
