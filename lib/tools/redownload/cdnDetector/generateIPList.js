var http    = require('https');
var zlib    = require('zlib');
var fs      = require('fs');

var CDN_ASN_LIST = {
    13335: 'Cloudflare',
    15133: 'Verizon',
    16625: 'Akamai',
    20446: 'StackPath',
    20940: 'Akamai',
    22822: 'Limelight',
    54113: 'Fastly'
};

// Downloads a file and ungzip ip directly
function getGzipped(url, callback) {
    var buffer = [];
    http.get(url, function(res) {
        var gunzip = zlib.createGunzip();            
        res.pipe(gunzip);
        gunzip.on('data', function(data) {
            buffer.push(data.toString())
        }).on('end', function() {
            callback(null, buffer.join('')); 
        }).on('error', function(e) {
            callback(e);
        })
    }).on('error', function(e) {
        callback(e)
    });
}

// File provided here: https://iptoasn.com/
console.log('Start downloading the file...');
getGzipped('https://iptoasn.com/data/ip2asn-v4.tsv.gz', function(err, data) {
    
    if (err) {
        console.log(err);
        return;
    }

    console.log('Download complete, let\'s start parsing...');
    parseFile(data);
});

// Parse the CSV formated file and grag only the interesting IP ranges
function parseFile(data) {
    var results = [];

    var allTextLines = data.split(/\r\n|\n/);
    for (var i = 0; i < allTextLines.length; i++) {
        var lineData = allTextLines[i].split('\t');
        
        var cdnName = CDN_ASN_LIST[lineData[2]];
        if (cdnName) {

            // We found an ASN number from our list. Let's save it!
            results.push({
                rangeStart: lineData[0],
                rangeEnd: lineData[1],
                cdn: cdnName
            });
        }
    }

    console.log('%d IP ranges found', results.length);

    var outputFile = __dirname + '/cdn-ip-list.json';
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log('File saved here: %s', outputFile);
}