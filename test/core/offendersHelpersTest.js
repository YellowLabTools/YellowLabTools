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

});
