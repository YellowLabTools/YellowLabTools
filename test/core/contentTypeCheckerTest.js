var should = require('chai').should();
var contentTypeChecker = require('../../lib/tools/redownload/contentTypeChecker');
var fs = require('fs');
var path = require('path');

describe('contentTypeChecker', function() {

    var jpgImageContent = fs.readFileSync(path.resolve(__dirname, '../www/jpeg-image.jpg'));
    var pngImageContent = fs.readFileSync(path.resolve(__dirname, '../www/png-image.png'));
    var svgImageContent = fs.readFileSync(path.resolve(__dirname, '../www/svg-image.svg'));
    var cssFileContent = fs.readFileSync(path.resolve(__dirname, '../www/unminified-stylesheet.css'));
    
    it('detect the right content type', function() {
        contentTypeChecker.findContentType(jpgImageContent).mimes.should.deep.equal(['image/jpeg']);
        contentTypeChecker.findContentType(pngImageContent).mimes.should.deep.equal(['image/png']);
        contentTypeChecker.findContentType(svgImageContent).mimes.should.deep.equal(['image/svg+xml']);
        should.equal(contentTypeChecker.findContentType(cssFileContent), null);
    });

});
