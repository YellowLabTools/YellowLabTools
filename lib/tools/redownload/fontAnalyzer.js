var debug = require('debug')('ylt:fontAnalyzer');

var Q           = require('q');
var fontkit     = require('fontkit');

var FontAnalyzer = function() {

    function analyzeFont(entry) {
        var deferred = Q.defer();
        
        if (!entry.weightCheck || !entry.weightCheck.body) {
            // No valid file available
            deferred.resolve(entry);
            return deferred.promise;
        }

        var fileSize = entry.weightCheck.uncompressedSize;

        if (entry.isWebFont) {
            debug('File %s is a font. Let\'s have a look inside!', entry.url);
            
            getMetricsFromTTF(entry.weightCheck.body)

            .then(function(metrics) {
                debug(metrics);
                deferred.resolve(entry);
            })

            .fail(function(error) {
                debug('Could not open the font: %s', error);
                deferred.resolve(entry);
            });

        } else {
            deferred.resolve(entry);
        }
        
        return deferred.promise;
    }

    function getMetricsFromTTF(body) {
        var deferred = Q.defer();
        
        try {
            var buffer = new Buffer(body, 'binary');
            console.log(buffer.length);
            console.log(buffer);
            /*var font = fontkit.create(buffer);
            console.log(font.fullName);*/

            deferred.resolve();
        } catch(error) {
            console.log(error);
            console.log(error.stack);
            deferred.reject(error);
        }

        return deferred.promise;
    }

    return {
        analyzeFont: analyzeFont,
        getMetricsFromTTF: getMetricsFromTTF
    };
};

module.exports = new FontAnalyzer();