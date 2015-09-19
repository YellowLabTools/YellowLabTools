var should = require('chai').should();
var colorDiff = require('../../lib/tools/colorDiff');

describe('colorDiff', function() {
    
    it('should parse offenders correctly', function() {
        colorDiff.parseOffender('#000 (1 times)').should.equal('#000');
        colorDiff.parseOffender('#5bc0de (2 times)').should.equal('#5bc0de');
        colorDiff.parseOffender('rgba(0,0,0,0.075) (100 times)').should.equal('rgba(0,0,0,0.075)');
        colorDiff.parseOffender('rgb(91,192,222) (1000 times)').should.equal('rgb(91,192,222)');
    });

    it('should parse colors correctly', function() {
        colorDiff.parseColor('#000').should.deep.equal({R: 0, G: 0, B: 0, A: 1, Lab: {L: 0, a: 0, b: 0}, original: '#000'});
        colorDiff.parseColor('rgba(255,255,255,0.5)').should.deep.equal({R: 255, G: 255, B: 255, A: 0.5, Lab: {L: 100, a: 0.00526049995830391, b: -0.010408184525267927}, original: 'rgba(255,255,255,0.5)'});
    });

    it('should not compare colors with different alpha', function() {
        var color1 = colorDiff.parseColor("rgba(0, 0, 0, 1)");
        var color2 = colorDiff.parseColor("rgba(0, 0, 0, 0.5)");

        colorDiff.compareTwoColors(color1, color2).should.equal(false);
    });

    it('should find that two colors are similar', function() {
        var color1 = colorDiff.parseColor("rgba(0, 0, 0, 1)");
        var color2 = colorDiff.parseColor("rgba(0, 0, 1, 1)");

        colorDiff.compareTwoColors(color1, color2).should.equal(true);
    });

    it('should find that two colors are similar even with alpha', function() {
        var color1 = colorDiff.parseColor("rgba(0, 0, 0, 0.3)");
        var color2 = colorDiff.parseColor("rgba(0, 0, 2, 0.3)");

        colorDiff.compareTwoColors(color1, color2).should.equal(true);
    });

    it('should find that two colors are different', function() {
        var color1 = colorDiff.parseColor("rgba(0, 0, 0, 1)");
        var color2 = colorDiff.parseColor("rgba(99, 99, 99, 1)");

        colorDiff.compareTwoColors(color1, color2).should.equal(false);
    });

    it('should compare all colors to each other', function() {
        var colors = [
            '#000 (1 times)',
            '#5bc0de (2 times)',
            'rgba(0,0,0,0.075) (100 times)',
            'rgb(91,192,222) (1000 times)',
            'rgba(0,0,2,1) (1 times)',
            'rgba(99,99,99,1) (1 times)',
            'rgba(100,100,100,1) (1 times)'
        ];

        var data = {
            toolsResults: {
                phantomas: {
                    offenders: {
                        cssColors: colors
                    }
                }
            }
        };

        newData = colorDiff.compareAllColors(data);

        newData.toolsResults.should.have.a.property('colorDiff');
        newData.toolsResults.colorDiff.should.have.a.property('metrics');
        newData.toolsResults.colorDiff.metrics.should.have.a.property('similarColors').that.equals(3);
        newData.toolsResults.colorDiff.should.have.a.property('offenders');
        newData.toolsResults.colorDiff.offenders.should.have.a.property('similarColors').that.deep.equals([
            {
                color1: '#000',
                color2: 'rgba(0,0,2,1)',
                isDark: true
            },
            {
                color1: '#5bc0de',
                color2: 'rgb(91,192,222)',
                isDark: false
            },
            {
                color1: 'rgba(99,99,99,1)',
                color2: 'rgba(100,100,100,1)',
                isDark: true
            }
        ]);
    });

});
