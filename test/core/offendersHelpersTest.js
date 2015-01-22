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
            var result = offendersHelpers.listOfDomArraysToTree([
                ['body', 'section#page', 'div.alternate-color', 'ul.retroGuide', 'li[0]', 'div.retro-chaine.france2'],
                ['body', 'section#page', 'div.alternate-color', 'ul.retroGuide', 'li[0]', 'div.retro-chaine.france2'],
                ['body', 'section#page', 'div.alternate-color', 'ul.retroGuide', 'li[1]', 'div.retro-chaine.france2']
            ]);
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
        });

    });

    describe('domTreeToHTML', function() {

        it('should transform a dom tree into HTML with the awaited format', function() {
            var result = offendersHelpers.domTreeToHTML({
                'body': {
                    'ul.retroGuide': {
                        'li[0]': {
                            'div.retro-chaine.france2': 2
                        },
                        'li[1]': {
                            'div.retro-chaine.france2': 1
                        }
                    }
                }
            });

            result.should.equal('<div class="domTree"><div><span>body</span><div><span>ul.retroGuide</span><div><span>li[0]</span><div><span>div.retro-chaine.france2 <span>(x2)</span></span></div></div><div><span>li[1]</span><div><span>div.retro-chaine.france2</span></div></div></div></div></div>');
        });

    });

    describe('listOfDomPathsToHTML', function() {

        it('should transform a list of path strings into HTML', function() {
            var result = offendersHelpers.listOfDomPathsToHTML([
                'body > ul.retroGuide > li[0] > div.retro-chaine.france2',
                'body > ul.retroGuide > li[1] > div.retro-chaine.france2',
                'body > ul.retroGuide > li[0] > div.retro-chaine.france2',
            ]);

            result.should.equal('<div class="domTree"><div><span>body</span><div><span>ul.retroGuide</span><div><span>li[0]</span><div><span>div.retro-chaine.france2 <span>(x2)</span></span></div></div><div><span>li[1]</span><div><span>div.retro-chaine.france2</span></div></div></div></div></div>');
        });

    });

    describe('domPathToButton', function() {

        it('should transform html', function() {
            var result = offendersHelpers.domPathToButton('html');
            result.should.equal('<div class="offenderButton"><b>html</b></div>');
        });

        it('should transform body', function() {
            var result = offendersHelpers.domPathToButton('body');
            result.should.equal('<div class="offenderButton"><b>body</b></div>');
        });

        it('should transform head', function() {
            var result = offendersHelpers.domPathToButton('head');
            result.should.equal('<div class="offenderButton"><b>head</b></div>');
        });

        it('should transform #document', function() {
            var result = offendersHelpers.domPathToButton('#document');
            result.should.equal('<div class="offenderButton"><b>document</b></div>');
        });

        it('should transform window', function() {
            var result = offendersHelpers.domPathToButton('window');
            result.should.equal('<div class="offenderButton"><b>window</b></div>');
        });

        it('should transform a standard in-body element', function() {
            var result = offendersHelpers.domPathToButton('body > div#colorbox > div#cboxContent');
            result.should.equal('<div class="offenderButton opens">DOM element <b>div#cboxContent</b><div class="domTree"><div><span>body</span><div><span>div#colorbox</span><div><span>div#cboxContent</span></div></div></div></div></div>');
        });

        it('should transform a domFragment element', function() {
            var result = offendersHelpers.domPathToButton('DocumentFragment');
            result.should.equal('<div class="offenderButton">Fragment</div>');
        });

        it('should transform a domFragment element', function() {
            var result = offendersHelpers.domPathToButton('DocumentFragment > div#colorbox > div#cboxContent');
            result.should.equal('<div class="offenderButton opens">Fragment element <b>div#cboxContent</b><div class="domTree"><div><span>DocumentFragment</span><div><span>div#colorbox</span><div><span>div#cboxContent</span></div></div></div></div></div>');
        });

        it('should transform an not-attached element', function() {
            var result = offendersHelpers.domPathToButton('div#sizcache');
            result.should.equal('<div class="offenderButton">Created element <b>div#sizcache</b></div>');
        });

        it('should transform an not-attached element path', function() {
            var result = offendersHelpers.domPathToButton('div > div#sizcache');
            result.should.equal('<div class="offenderButton opens">Created element <b>div#sizcache</b><div class="domTree"><div><span>div</span><div><span>div#sizcache</span></div></div></div></div>');
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

        it('should return null if it fails', function() {
            var result = offendersHelpers.backtraceToArray('http://pouet.com/js/jquery.footer-transverse-min-v1.0.20.js:1 /http://pouet.com/js/main.js:1');

            should.equal(result, null);
        });

    });

    describe('backtraceArrayToHtml', function() {

        it('should create a button from a backtrace array', function() {
            var result = offendersHelpers.backtraceArrayToHtml([
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

            result.should.equal('<div class="offenderButton opens">backtrace<div class="backtrace"><div><a href="http://pouet.com/js/jquery.footer-transverse-min-v1.0.20.js" target="_blank" title="http://pouet.com/js/jquery.footer-transverse-min-v1.0.20.js">http://pouet.com/js/jquery.footer-transverse-min-v1.0.20.js</a> line 1</div><div>callback() <a href="http://pouet.com/js/main.js" target="_blank" title="http://pouet.com/js/main.js">http://pouet.com/js/main.js</a> line 1</div></div></div>');
        });

        it('should display "no backtrace"', function() {
            var result = offendersHelpers.backtraceArrayToHtml([]);

            result.should.equal('<div class="offenderButton">no backtrace</div>');
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
            var result = offendersHelpers.cssOffenderPattern('.pagination .plus ul li @ 30:31862');

            result.should.deep.equal({
                offender: '.pagination .plus ul li',
                line: 30,
                character: 31862
            });
        });

        it('should handle the case where line and char are not here', function() {
            var result = offendersHelpers.cssOffenderPattern('.pagination .plus ul li');

            result.should.deep.equal({
                offender: '.pagination .plus ul li'
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
