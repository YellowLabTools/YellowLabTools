#!/usr/bin/env node

var debug = require('debug')('ylt:cli');
var meow = require('meow');
var path = require('path');

var ylt = require('../lib/index');

var cli = meow({
    help: [
        'Usage',
        '  yellowlabtools <url> <options>',
        '',
        'Options:',
        '  --screenshot         Will take a screenshot and use this value as the output path. It needs to end with ".png".',
        '  --js-deep-analysis   When activated, the javascriptExecutionTree will contain sub-requests.',
        ''
    ].join('\n'),
    pkg: '../package.json'
});



// Check parameters
if (cli.input.length < 1) {
    console.error('Incorrect parameters: url not provided');
    process.exit(1);
}

var url = cli.input[0];

var options = {};

// Screenshot option
var screenshot = cli.flags.screenshot;
if (screenshot && (typeof screenshot !== 'string' || screenshot.toLowerCase().indexOf('.png', screenshot.length - 4) === -1)) {
    console.error('Incorrect parameters: screenshot must be a path that ends with ".png"');
    process.exit(1);
}
if (screenshot) {
    if (path.resolve(screenshot) !== path.normalize(screenshot)) {
        // It is not an absolute path, so it is relative to the current command-line directory
        screenshot = path.join(process.cwd(), screenshot);
    }
    options.screenshot = cli.flags.screenshot;
}

// Deep JS analysis option
if (cli.flags.jsDeepAnalysis === true || cli.flags.jsDeepAnalysis === 'true') {
    options.jsDeepAnalysis = true;
}


(function execute(url, options) {
    'use strict';

    ylt(url, options).

        then(function(data) {

            debug('Success');
            console.log(JSON.stringify(data, null, 2));

        }).fail(function(err) {
            
            debug('Test failed for %s', url);
            console.error(err);
            
        });

    debug('Test launched...');

})(url, options);