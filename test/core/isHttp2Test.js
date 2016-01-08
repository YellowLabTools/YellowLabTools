var should = require('chai').should();
var isHttp2 = require('../../lib/tools/isHttp2');

describe('isHttp2', function() {
    
    it('should parse the protocol correctly', function() {
        isHttp2.getProtocol({
            toolsResults: {
                phantomas: {
                    url: 'http://www.yahoo.com'
                }
            }
        }).should.equal('http:');


        isHttp2.getProtocol({
            toolsResults: {
                phantomas: {
                    url: 'https://www.yahoo.com'
                }
            }
        }).should.equal('https:');
    });

    it('should parse the domain correctly', function() {
        isHttp2.getDomain({
            toolsResults: {
                phantomas: {
                    url: 'http://www.yahoo.com'
                }
            }
        }).should.equal('www.yahoo.com');


        isHttp2.getDomain({
            toolsResults: {
                phantomas: {
                    url: 'https://www.yahoo.com'
                }
            }
        }).should.equal('www.yahoo.com');
    });

    it('should have a function checkHttp2', function() {
        isHttp2.should.have.a.property('checkHttp2').that.is.a('function');
    });

});
