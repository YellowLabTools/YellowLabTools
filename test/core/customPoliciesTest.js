var should = require('chai').should();
var rulesChecker = require('../../lib/rulesChecker');

describe('rulesChecker', function() {
    
    var policies = require('../../lib/metadata/policies.js');

 
    it('should grade correctly jQuery versions', function() {
        

        var versions = {
            '1.2.9': 0,
            '1.3.9': 0,
            '1.4.4': 10,
            '1.5.0': 20,
            '1.6.3': 30,
            '1.7.0': 40,
            '1.8.3a': 50,
            '1.9.2': 70,
            '1.10.1': 90,
            '2.0.0-rc1': 90,
            '1.11.1': 100,
            '2.1.1-beta1': 100,
            '3.0.0': 100
        };

        for (var version in versions) {
            results = rulesChecker.check({
                "toolsResults": {
                    "phantomas": {
                        "metrics": {
                            "jQueryVersion": version
                        }
                    }
                }
            }, policies);
            results.jQueryVersion.score.should.equal(versions[version]);
        }


        // Unknown jQuery version
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "jQueryVersion": "wooot"
                    }
                }
            }
        }, policies);
        results.should.deep.equals({});


        // If jQueryDifferentVersions is 0
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "jQueryVersion": "1.6.0",
                        "jQueryDifferentVersions": 0
                    }
                }
            }
        }, policies);
        results.should.not.have.a.property('jQueryVersion');
        results.should.have.a.property('jQueryDifferentVersions');
        results.jQueryDifferentVersions.should.have.a.property('score').that.equals(100);


        // If there are more than 1 jQuery version
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "jQueryVersion": "1.6.0",
                        "jQueryDifferentVersions": 2
                    }
                }
            }
        }, policies);
        results.should.not.have.a.property('jQueryVersion');
        results.should.have.a.property('jQueryDifferentVersions');
        results.jQueryDifferentVersions.should.have.a.property('score').that.equals(0);
        results.jQueryDifferentVersions.should.have.a.property('abnormal').that.equals(true);
    });
});
