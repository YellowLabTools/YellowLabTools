var should = require('chai').should();
var mediaQueriesChecker = require('../../lib/tools/mediaQueriesChecker');

describe('mediaQueriesChecker', function() {
    
    it('should parse mediaQueryes correctly', function() {
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 1024px) (1 rules) <http://domain.com/css/stylesheet.css> @ 269:1').should.deep.equal({
            mediaQuery: {
                query: 'screen and (max-width: 1024px)',
                rules: 1,
                file: 'http://domain.com/css/stylesheet.css',
                line: 269,
                column: 1
            },
            isForMobile: true,
            breakpoints: [{string: '1024px', pixels: 1024}]
        });
    });

    it('should determine if it\'s for mobile correctly', function() {
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 1024px) (1 rules) <file> @ 1:1').isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery('@media (max-width:1024px) (1 rules) <file> @ 1:1').isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 320px) (1 rules) <file> @ 1:1').isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 290px) (1 rules) <file> @ 1:1').isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (min-width: 320px) (1 rules) <file> @ 1:1').isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (min-width: 600px) (1 rules) <file> @ 1:1').isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 20em) (1 rules) <file> @ 1:1').isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (min-width: 40em) (1 rules) <file> @ 1:1').isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery('@media (min-width: 600px) and (max-width: 1000px) (1 rules) <file> @ 1:1').isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery('@media (min-width: 180px) and (max-width: 400px) (1 rules) <file> @ 1:1').isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery('@media (min-width: 180px) and (max-width: 290px) (1 rules) <file> @ 1:1').isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery('@media not all and (min-width: 600px) (1 rules) <file> @ 1:1').isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery('@media not all and (min-width: 180px) (1 rules) <file> @ 1:1').isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery('@media not all and (min-width: 1000px) and (max-width: 600px) (1 rules) <file> @ 1:1').isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery('@media not all and (min-width: 400px) and (max-width: 180px) (1 rules) <file> @ 1:1').isForMobile.should.equal(true);
    });

    it('should count breakpoints correctly', function() {
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 1024px) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '1024px', pixels: 1024}]);
        mediaQueriesChecker.parseOneMediaQuery('@media (max-width:1024px) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '1024px', pixels: 1024}]);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 320px) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '320px', pixels: 320}]);
        mediaQueriesChecker.parseOneMediaQuery('@media (min-width: 600px) and (max-width: 1000px) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '600px', pixels: 600}, {string: '1000px', pixels: 1000}]);
        mediaQueriesChecker.parseOneMediaQuery('@media not all and (min-width: 180px) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '180px', pixels: 180}]);
        mediaQueriesChecker.parseOneMediaQuery('@media not all and (min-width: 1000px) and (max-width: 600px) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '1000px', pixels: 1000}, {string: '600px', pixels: 600}]);
        mediaQueriesChecker.parseOneMediaQuery('@media (max-height:500px) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([]);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 100em) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '100em', pixels: 1600}]);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 120pt) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '120pt', pixels: 160}]);
        mediaQueriesChecker.parseOneMediaQuery('@media screen and (max-width: 40.2em) (1 rules) <file> @ 1:1').breakpoints.should.deep.equal([{string: '40.2em', pixels: 643.2}]);
    });

    it('should fail silently', function() {
        mediaQueriesChecker.parseOneMediaQuery('@media bad syntax (1 rules) <file> @ 1:1').isForMobile.should.equal(false); 
    });

});
