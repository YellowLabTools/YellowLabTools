var should = require('chai').should();
var rulesChecker = require('../../lib/rulesChecker');

describe('rulesChecker', function() {
    
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
                            "colorswitch-30883-30865: 4 occurrences",
                            "foo: 1 occurrences"
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

    
    it('should transform DOMinserts offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "DOMinserts": 4
                    },
                    "offenders": {
                        "DOMinserts": [
                            "\"div\" appended to \"html\"",
                            "\"DocumentFragment > link[0]\" appended to \"head\"",
                            "\"div#Netaff-yh1XbS0vK3NaRGu\" appended to \"body > div#Global\"",
                            "\"img\" appended to \"body\""
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('DOMinserts');
        results.DOMinserts.should.have.a.property('offendersObj').that.deep.equals({
            "count": 4,
            "list": [
                {
                    "insertedElement": {
                        "type": "createdElement",
                        "element": "div"
                    },
                    "receiverElement": {
                        "type": "html"
                    }
                },
                {
                    "insertedElement": {
                        "type": "fragmentElement",
                        "element": "link[0]",
                        "tree": {
                            "DocumentFragment": {
                                "link[0]": 1
                            }
                        }
                    },
                    "receiverElement": {
                        "type": "head"
                    }
                },
                {
                    "insertedElement": {
                        "type": "createdElement",
                        "element": "div#Netaff-yh1XbS0vK3NaRGu"
                    },
                    "receiverElement": {
                        "type": "domElement",
                        "element": "div#Global",
                        "tree": {
                            "body": {
                                "div#Global": 1
                            }
                        }
                    }
                },
                {
                    "insertedElement": {
                        "type": "createdElement",
                        "element": "img"
                    },
                    "receiverElement": {
                        "type": "body"
                    }
                }
            ]
        });
    });

    
    it('should transform DOMqueriesWithoutResults offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "DOMqueriesWithoutResults": 2
                    },
                    "offenders": {
                        "DOMqueriesWithoutResults": [
                            "#SearchMenu (in #document) using getElementById",
                            ".partnership-link (in body > div#Global > div#Header > ul#MainMenu) using getElementsByClassName"
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('DOMqueriesWithoutResults');
        results.DOMqueriesWithoutResults.should.have.a.property('offendersObj').that.deep.equals({
            "count": 2,
            "list": [
                {
                    "context": {
                        "type": "document"
                    },
                    "fn": "getElementById",
                    "query": "#SearchMenu "
                },
                {
                    "context": {
                        "element": "ul#MainMenu",
                        "tree": {
                            "body": {
                                "div#Global": {
                                    "div#Header": {
                                        "ul#MainMenu": 1
                                    }
                                }
                            }
                        },
                        "type": "domElement"
                    },
                    "fn": "getElementsByClassName",
                    "query": ".partnership-link "
                }
            ]
        });
    });


    it('should transform DOMqueriesAvoidable offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "DOMqueriesAvoidable": 2
                    },
                    "offenders": {
                        "DOMqueriesDuplicated": [
                            "id \"#j2t-top-cart\" with getElementById (in context #document): 4 queries",
                            "class \".listingResult\" with getElementsByClassName (in context body > div#Global > div#Listing): 4 queries"
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('DOMqueriesAvoidable');
        results.DOMqueriesAvoidable.should.have.a.property('offendersObj').that.deep.equals({
            "count": 2,
            "list": [
                {
                    "query": "#j2t-top-cart",
                    "context": {
                        "type": "document"
                    },
                    "fn": "getElementById ",
                    "count": 4
                },
                {
                    "query": ".listingResult",
                    "context": {
                        "type": "domElement",
                        "element": "div#Listing",
                        "tree": {
                            "body": {
                                "div#Global": {
                                    "div#Listing": 1
                                }
                            }
                        }
                    },
                    "fn": "getElementsByClassName ",
                    "count": 4
                }
            ]
        });
    });


    it('should transform eventsBound offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "eventsBound": 2
                    },
                    "offenders": {
                        "eventsBound": [
                            "\"DOMContentLoaded\" bound to \"#document\"",
                            "\"unload\" bound to \"window\"",
                            "\"submit\" bound to \"body > div#Global > div#Header > form#search_mini_form\""
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('eventsBound');
        results.eventsBound.should.have.a.property('offendersObj').that.deep.equals({
            "count": 3,
            "list": [
                {
                    "element": {
                        "type": "document"
                    },
                    "eventName": "DOMContentLoaded"
                },
                {
                    "element": {
                        "type": "window"
                    },
                    "eventName": "unload"
                },
                {
                    "element": {
                        "element": "form#search_mini_form",
                        "tree": {
                            "body": {
                                "div#Global": {
                                    "div#Header": {
                                        "form#search_mini_form": 1
                                    }
                                }
                            }
                        },
                        "type": "domElement"
                    },
                    "eventName": "submit"
                }
            ]
        });
    });


    it('should transform jsErrors offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "jsErrors": 2
                    },
                    "offenders": {
                        "jsErrors": [
                            "TypeError: 'undefined' is not a function (evaluating 'this.successfullyCollected.bind(this)') - http://asset.easydmp.net/js/collect.js:1160 / callCollecte http://asset.easydmp.net/js/collect.js:1203 / callbackUpdateParams http://asset.easydmp.net/js/collect.js:1135 / http://asset.easydmp.net/js/collect.js:1191",
                            "TypeError: 'undefined' is not an object (evaluating 'd.readyState') - http://me.hunkal.com/p/:3"
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('jsErrors');
        results.jsErrors.should.have.a.property('offendersObj').that.deep.equals({
            "count": 2,
            "list": [
                {
                    "error": "TypeError: 'undefined' is not a function (evaluating 'this.successfullyCollected.bind(this)')",
                    "backtrace": [
                        {
                            "file": "http://asset.easydmp.net/js/collect.js",
                            "line": 1160
                        },
                        {
                            "file": "http://asset.easydmp.net/js/collect.js",
                            "line": 1203,
                            "functionName": "callCollecte"
                        },
                        {
                            "file": "http://asset.easydmp.net/js/collect.js",
                            "line": 1135,
                            "functionName": "callbackUpdateParams"
                        },
                        {
                            "file": "http://asset.easydmp.net/js/collect.js",
                            "line": 1191
                        }
                    ]
                },
                {
                    "error": "TypeError: 'undefined' is not an object (evaluating 'd.readyState')",
                    "backtrace": [
                        {
                            "file": "http://me.hunkal.com/p/",
                            "line": 3
                        }
                    ]
                }
            ]
        });
    });


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


    it('should transform cssParsingErrors offenders', function() {
        results = rulesChecker.check({
            "toolsResults": {
                "phantomas": {
                    "metrics": {
                        "cssParsingErrors": 2
                    },
                    "offenders": {
                        "cssParsingErrors": [
                            "<http://www.sudexpress.com/skin/frontend/sudexpress/default/css/styles.css> (Error: CSS parsing failed: missing '}' @ 4:1)",
                            "<http://www.sudexpress.com/skin/frontend/sudexpress/default/css/reset.css> (Empty CSS was provided)"
                        ]
                    }
                }
            }
        }, policies);

        results.should.have.a.property('cssParsingErrors');
        results.cssParsingErrors.should.have.a.property('offendersObj').that.deep.equals({
            "count": 2,
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
                }
            ]
        });
    });

    
    // Enough for the moment, to be complete...

});
