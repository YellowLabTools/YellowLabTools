var should = require('chai').should();
var rulesChecker = require('../../lib/rulesChecker');

describe('customPolicies', function() {
    
    var policies = require('../../lib/metadata/policies.js');
    var results;

 
    it('should transform DOMelementMaxDepth offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "DOMelementMaxDepth": 3
                    },
                    "offenders": {
                        "DOMelementMaxDepth": [
                            "body > div#foo > span.bar"
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('DOMelementMaxDepth');
        results.DOMelementMaxDepth.should.have.a.property('offendersObj').that.deep.equals({
            "count": 1,
            "tree": {
                "body": {
                    "div#foo": {
                        "span.bar": 1
                    }
                }
            }
        });
    });


    it('should transform DOMidDuplicated offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "DOMidDuplicated": 2
                    },
                    "offenders": {
                        "DOMidDuplicated": [
                            {
                                "id": "colorswitch-30883-30865",
                                "occurrences": 4
                            }, {
                                "id": "foo",
                                "occurrences": 1
                            }
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('DOMidDuplicated');
        results.DOMidDuplicated.should.have.a.property('offendersObj').that.deep.equals({
            "count": 2,
            "list": [
                {
                    "id": "colorswitch-30883-30865",
                    "occurrences": 4
                },
                {
                    "id": "foo",
                    "occurrences": 1
                }
            ]
        });
    });


    it('should grade correctly jQuery versions', function() {

        var versions = {
            '1.7.0': 0,
            '1.10.1': 20,
            '1.10.3a': 20,
            '2.0.0-rc1': 20,
            '1.11.1': 30,
            '2.1.1-beta1': 30,
            '1.12.1': 40,
            '2.2.1': 40,
            '3.0.1': 50,
            '3.1.0': 70,
            '3.2.1': 90,
            '3.3.1': 100,
            '3.5.0': 100
        };

        for (var version in versions) {
            results = rulesChecker.check({
                "toolsResults": {
                    "phantomas": {
                        "metrics": {
                            "jQueryVersion": version
                        },
                        "offenders": {}
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
                    },
                    "offenders": {}
                }
            }
        }, policies);
        results.should.not.have.a.property('jQueryVersion');


        // If jQueryVersionsLoaded is 0
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "jQueryVersion": "1.6.0",
                        "jQueryVersionsLoaded": 0
                    },
                    "offenders": {}
                }
            }
        }, policies);
        results.should.not.have.a.property('jQueryVersion');
        results.should.have.a.property('jQueryVersionsLoaded');
        results.jQueryVersionsLoaded.should.have.a.property('score').that.equals(100);


        // If there are more than 1 jQuery version
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "jQueryVersion": "1.6.0",
                        "jQueryVersionsLoaded": 2
                    },
                    "offenders": {}
                }
            }
        }, policies);
        results.should.not.have.a.property('jQueryVersion');
        results.should.have.a.property('jQueryVersionsLoaded');
        results.jQueryVersionsLoaded.should.have.a.property('score').that.equals(0);
        results.jQueryVersionsLoaded.should.have.a.property('abnormal').that.equals(false);
    });


    it('should transform cssParsingErrors offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "cssParsingErrors": 2
                    },
                    "offenders": {
                        "cssParsingErrors": [
                            {
                                "url": "http://www.sudexpress.com/skin/frontend/sudexpress/default/css/styles.css",
                                "value": {
                                    "message": "Error: CSS parsing failed: missing '}'",
                                    "position": {
                                        "start": {
                                            "line": 4,
                                            "column": 1
                                        },
                                        "end": {
                                            "line": 4,
                                            "column": 72
                                        }
                                    }
                                }
                            },
                            {
                                "url": "http://www.sudexpress.com/skin/frontend/sudexpress/default/css/reset.css",
                                "value": {
                                    "message": "Empty CSS was provided"
                                }
                            },
                            "http://www.sudexpress.com/skin/frontend/sudexpress/default/css/another.css"
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('cssParsingErrors');
        results.cssParsingErrors.should.have.a.property('offendersObj').that.deep.equals({
            "count": 3,
            "list": [
                {
                    "error": "Error: CSS parsing failed: missing '}'",
                    "file": "http://www.sudexpress.com/skin/frontend/sudexpress/default/css/styles.css",
                    "line": 4,
                    "column": 1
                },
                {
                    "error": "Empty CSS was provided",
                    "file": "http://www.sudexpress.com/skin/frontend/sudexpress/default/css/reset.css",
                    "line": null,
                    "column": null
                },
                {
                    "error": "Unknown parsing error. The entire file was ignored. As a result, the other CSS metrics and scores are miscalculated.",
                    "file": "http://www.sudexpress.com/skin/frontend/sudexpress/default/css/another.css",
                    "line": null,
                    "column": null
                }
            ]
        });
    });

    
    // Enough for the moment, to be complete...

});
