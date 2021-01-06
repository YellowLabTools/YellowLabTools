var should = require('chai').should();
var mediaQueriesChecker = require('../../lib/tools/mediaQueriesChecker');

describe('mediaQueriesChecker', function() {

    function wrap(message) {
        return {
            url: 'http://domain.com/css/stylesheet.css',
            value: {
                message: message,
                position: {
                    start: {
                        line: 269,
                        column: 1
                    },
                    end: {
                        line: 269,
                        column: 182
                    }
                }
            }
        };
    }
    
    it('should parse mediaQueryes correctly', function() {
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 1024px) (1 rules)'))
            .should.deep.equal({
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
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 1024px) (1 rules)')).isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media (max-width:1024px) (1 rules)')).isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 320px) (1 rules)')).isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 290px) (1 rules)')).isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (min-width: 320px) (1 rules)')).isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (min-width: 600px) (1 rules)')).isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 20em) (1 rules)')).isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (min-width: 40em) (1 rules)')).isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media (min-width: 600px) and (max-width: 1000px) (1 rules)')).isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media (min-width: 180px) and (max-width: 400px) (1 rules)')).isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media (min-width: 180px) and (max-width: 290px) (1 rules)')).isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media not all and (min-width: 600px) (1 rules)')).isForMobile.should.equal(true);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media not all and (min-width: 180px) (1 rules)')).isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media not all and (min-width: 1000px) and (max-width: 600px) (1 rules)')).isForMobile.should.equal(false);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media not all and (min-width: 400px) and (max-width: 180px) (1 rules)')).isForMobile.should.equal(true);
    });

    it('should count breakpoints correctly', function() {
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 1024px) (1 rules)')).breakpoints.should.deep.equal([{string: '1024px', pixels: 1024}]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media (max-width:1024px) (1 rules)')).breakpoints.should.deep.equal([{string: '1024px', pixels: 1024}]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 320px) (1 rules)')).breakpoints.should.deep.equal([{string: '320px', pixels: 320}]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media (min-width: 600px) and (max-width: 1000px) (1 rules)')).breakpoints.should.deep.equal([{string: '600px', pixels: 600}, {string: '1000px', pixels: 1000}]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media not all and (min-width: 180px) (1 rules)')).breakpoints.should.deep.equal([{string: '180px', pixels: 180}]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media not all and (min-width: 1000px) and (max-width: 600px) (1 rules)')).breakpoints.should.deep.equal([{string: '1000px', pixels: 1000}, {string: '600px', pixels: 600}]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media (max-height:500px) (1 rules)')).breakpoints.should.deep.equal([]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 100em) (1 rules)')).breakpoints.should.deep.equal([{string: '100em', pixels: 1600}]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 120pt) (1 rules)')).breakpoints.should.deep.equal([{string: '120pt', pixels: 160}]);
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media screen and (max-width: 40.2em) (1 rules)')).breakpoints.should.deep.equal([{string: '40.2em', pixels: 643.2}]);
    });

    it('should fail silently', function() {
        mediaQueriesChecker.parseOneMediaQuery(wrap('@media bad syntax (1 rules)')).isForMobile.should.equal(false); 
    });

});
