#!/usr/bin/env node

var debug = require('debug')('ylt:cli');

var YellowLabTools = require('../lib/yellowlabtools');

// Check parameters
if (process.argv.length !== 3) {
    console.error('Incorrect parameters');
    console.error('\nUsage: ylt <pageUrl>\n');
    process.exit(1);
}

var url = process.argv[2];

(function execute(url) {
    'use strict';

    var ylt = new YellowLabTools(url);
    debug('Test launched...');

    ylt.
        then(function(data) {

            debug('Success');
            console.log(JSON.stringify(data, null, 2));

        }).fail(function(err) {
            
            debug('Test failed for %s', url);
            console.error(err);
            
        });

})(url);