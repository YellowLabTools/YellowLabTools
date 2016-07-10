var should = require('chai').should();
var offendersHelpers = require('../../lib/offendersHelpers');

describe('offendersHelpers', function() {
    
    describe('domPathToArray', function() {

        it('should transform a path to an array', function() {
            var result = offendersHelpers.domPathToArray('body > section#page > div.alternate-color > ul.retroGuide > li[0] > div.retro-chaine.france2');
            result.should.deep.equal(['body', 'section#page', 'div.alternate-color', 'ul.retroGuide', 'li[0]', 'div.retro-chaine.france2']);
        });

        it('should work even if a space is missing', function() {
           var result = offendersHelpers.domPathToArray('body > section#page> div.alternate-color > ul.retroGuide >li[0] > div.retro-chaine.france2');
            result.should.deep.equal(['body', 'section#page', 'div.alternate-color', 'ul.retroGuide', 'li[0]', 'div.retro-chaine.france2']); 
        });

    });

    describe('listOfDomArraysToTree', function() {

        it('should transform a list of arrays into a tree', function() {
            var input = [
                ['body', 'section#page', 'div.alternate-color', 'ul.retroGuide', 'li[0]', 'div.retro-chaine.france2'],
                ['body', 'section#page', 'div.alternate-color', 'ul.retroGuide', 'li[0]', 'div.retro-chaine.france2'],
                ['body', 'section#page', 'div.alternate-color', 'ul.retroGuide', 'li[1]', 'div.retro-chaine.france2']
            ];

            var inputClone = input.slice();

            var result = offendersHelpers.listOfDomArraysToTree(input);
            result.should.deep.equal({
                'body': {
                    'section#page': {
                        'div.alternate-color': {
                            'ul.retroGuide': {
                                'li[0]': {
                                    'div.retro-chaine.france2': 2
                                },
                                'li[1]': {
                                    'div.retro-chaine.france2': 1
                                }
                            }
                        }
                    }
                }
            });

            input.should.deep.equal(inputClone);
        });

    });

    describe('domPathToDomElementObj', function() {

        it('should transform html', function() {
            var result = offendersHelpers.domPathToDomElementObj('html');
            result.should.deep.equal({
                type: 'html'
            });
        });

        it('should transform body', function() {
            var result = offendersHelpers.domPathToDomElementObj('body');
            result.should.deep.equal({
                type: 'body'
            });
        });

        it('should transform head', function() {
            var result = offendersHelpers.domPathToDomElementObj('head');
            result.should.deep.equal({
                type: 'head'
            });
        });

        it('should transform #document', function() {
            var result = offendersHelpers.domPathToDomElementObj('#document');
            result.should.deep.equal({
                type: 'document'
            });
        });

        it('should transform window', function() {
            var result = offendersHelpers.domPathToDomElementObj('window');
            result.should.deep.equal({
                type: 'window'
            });
        });

        it('should transform a standard in-body element', function() {
            var result = offendersHelpers.domPathToDomElementObj('body > div#colorbox > div#cboxContent');
            result.should.deep.equal({
                type: 'domElement',
                element: 'div#cboxContent',
                tree: {
                    'body': {
                        'div#colorbox': {
                            'div#cboxContent': 1
                        }
                    }
                }
            });
        });

        it('should transform a domFragment element', function() {
            var result = offendersHelpers.domPathToDomElementObj('DocumentFragment');
            result.should.deep.equal({
                type: 'fragment'
            });
        });

        it('should transform a domFragment element', function() {
            var result = offendersHelpers.domPathToDomElementObj('DocumentFragment > div#colorbox > div#cboxContent');
            result.should.deep.equal({
                type: 'fragmentElement',
                element: 'div#cboxContent',
                tree: {
                    'DocumentFragment': {
                        'div#colorbox': {
                            'div#cboxContent': 1
                        }
                    }
                }
            });
        });

        it('should transform an not-attached element', function() {
            var result = offendersHelpers.domPathToDomElementObj('div#sizcache');
            result.should.deep.equal({
                type: 'createdElement',
                element: 'div#sizcache'
            });
        });

        it('should transform an not-attached element path', function() {
            var result = offendersHelpers.domPathToDomElementObj('div > div#sizcache');
            result.should.deep.equal({
                type: 'createdElement',
                element: 'div#sizcache',
                tree: {
                    'div': {
                        'div#sizcache': 1
                    }
                }
            });
        });

    });

    describe('backtraceToArray', function() {

        it('should transform a backtrace into an array', function() {
            var result = offendersHelpers.backtraceToArray('http://pouet.com/js/jquery.footer-transverse-min-v1.0.20.js:1 / callback http://pouet.com/js/main.js:1');

            result.should.deep.equal([
                {
                    file: 'http://pouet.com/js/jquery.footer-transverse-min-v1.0.20.js',
                    line: 1
                },
                {
                    functionName: 'callback',
                    file: 'http://pouet.com/js/main.js',
                    line: 1
                }
            ]);
        });

        it('should transform another backtrace syntax into an array', function() {
            var result = offendersHelpers.backtraceToArray('phantomjs://webpage.evaluate():38 / e (http://s7.addthis.com/js/300/addthis_widget.js:1) / a (http://s7.addthis.com/js/300/addthis_widget.js:1) / http://s7.addthis.com/js/300/addthis_widget.js:3 / e (http://s7.addthis.com/js/300/addthis_widget.js:1) / http://s7.addthis.com/js/300/addthis_widget.js:8');

            result.should.deep.equal([
                {
                    file: 'phantomjs://webpage.evaluate()',
                    line: 38
                },
                {
                    functionName: 'e',
                    file: 'http://s7.addthis.com/js/300/addthis_widget.js',
                    line: 1
                },
                {
                    functionName: 'a',
                    file: 'http://s7.addthis.com/js/300/addthis_widget.js',
                    line: 1
                },
                {
                    file: 'http://s7.addthis.com/js/300/addthis_widget.js',
                    line: 3
                },
                {
                    functionName: 'e',
                    file: 'http://s7.addthis.com/js/300/addthis_widget.js',
                    line: 1
                },
                {
                    file: 'http://s7.addthis.com/js/300/addthis_widget.js',
                    line: 8
                }
            ]);
        });

        it('should transform a backtrace with the new PhantomJS 2.x syntax into an array', function() {
            var result = offendersHelpers.backtraceToArray('each@http://m.australia.fr/js/min/vendors.js?20160706185900:4:5365 / f@http://m.australia.fr/js/min/vendors.js?20160706185900:17:82 / http://m.australia.fr/js/min/vendors.js?20160706185900:17:855 / handle@http://m.australia.fr/js/min/vendors.js?20160706185900:5:10871 / report@phantomjs://platform/phantomas.js:535:20 / phantomjs://platform/phantomas.js:524:15');

            result.should.deep.equal([
                {
                    functionName: 'each',
                    file: 'http://m.australia.fr/js/min/vendors.js?20160706185900',
                    line: 4,
                    column: 5365
                },
                {
                    functionName: 'f',
                    file: 'http://m.australia.fr/js/min/vendors.js?20160706185900',
                    line: 17,
                    column: 82
                },
                {
                    file: 'http://m.australia.fr/js/min/vendors.js?20160706185900',
                    line: 17,
                    column: 855
                },
                {
                    functionName: 'handle',
                    file: 'http://m.australia.fr/js/min/vendors.js?20160706185900',
                    line: 5,
                    column: 10871
                },
                {
                    functionName: 'report',
                    file: 'phantomjs://platform/phantomas.js',
                    line: 535,
                    column: 20
                },
                {
                    file: 'phantomjs://platform/phantomas.js',
                    line: 524,
                    column: 15
                }
            ]);
        });

        it('should return null if it fails', function() {
            var result = offendersHelpers.backtraceToArray('http://pouet.com/js/jquery.footer-transverse-min-v1.0.20.js:1 /http://pouet.com/js/main.js:1');

            should.equal(result, null);
        });

    });

    describe('sortVarsLikeChromeDevTools', function() {

        it('should sort in the same strange order', function() {
            var result = offendersHelpers.sortVarsLikeChromeDevTools([
                'a',
                'aaa',
                'a2',
                'b',
                'A',
                'AAA',
                'B',
                '_a',
                '_aaa',
                '__a',
                'a_a',
                'aA',
                'a__',
                '$',
                '$a'
            ]);

            result.should.deep.equal([
                '$',
                '$a',
                'A',
                'AAA',
                'B',
                '__a',
                '_a',
                '_aaa',
                'a',
                'a2',
                'aA',
                'a__',
                'a_a',
                'aaa',
                'b'
            ]);
        });

    });

    describe('urlToLink', function() {

        it('should transform an url into an html link', function() {
            var result = offendersHelpers.urlToLink('http://www.google.com/js/main.js');

            result.should.equal('<a href="http://www.google.com/js/main.js" target="_blank" title="http://www.google.com/js/main.js">http://www.google.com/js/main.js</a>');
        });

        it('should ellypsis the url if too long', function() {
            var result = offendersHelpers.urlToLink('http://www.google.com/js/longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong/main.js');

            result.should.equal('<a href="http://www.google.com/js/longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong/main.js" target="_blank" title="http://www.google.com/js/longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong/main.js">http://www.google.com/js/longlonglonglonglonglo ... longlonglonglonglonglonglonglonglonglong/main.js</a>');
        });

    });


    describe('cssOffenderPattern', function() {

        it('should transform a css offender into an object', function() {
            var result = offendersHelpers.cssOffenderPattern('.pagination .plus ul li <http://www.pouet.com/css/main.css> @ 30:31862');

            result.should.deep.equal({
                css: '.pagination .plus ul li',
                file: 'http://www.pouet.com/css/main.css',
                line: 30,
                column: 31862
            });
        });

        it('should work with an inline css', function() {
            var result = offendersHelpers.cssOffenderPattern('.pagination .plus ul li [inline CSS] @ 1:32');

            result.should.deep.equal({
                css: '.pagination .plus ul li',
                file: null,
                line: 1,
                column: 32
            });
        });

        it('should handle the case where line and char are not here', function() {
            var result = offendersHelpers.cssOffenderPattern('.pagination .plus ul li');

            result.should.deep.equal({
                offender: '.pagination .plus ul li'
            });
        });

        it('should handle line breaks inside the string', function() {
            var result = offendersHelpers.cssOffenderPattern('.card-mask-wrap { -moz-transform: translate3d(0, \n-288px\n, 0) } // was required by firefox 15 and earlier [inline CSS] @ 29:3');

            result.should.deep.equal({
                css: '.card-mask-wrap { -moz-transform: translate3d(0, -288px, 0) } // was required by firefox 15 and earlier',
                file: null,
                line: 29,
                column: 3
            });
        }); 

    });

    describe('fileWithSizePattern', function() {

        it('should return an object', function() {
            var result = offendersHelpers.fileWithSizePattern('http://img3.pouet.com/2008/portail/js/jq-timer.js (1.72 kB)');

            result.should.deep.equal({
                file: 'http://img3.pouet.com/2008/portail/js/jq-timer.js',
                size: 1.72
            });
        });

    });

});
