#!/usr/bin/env node

var debug       = require('debug')('ylt:cli');
var meow        = require('meow');
var path        = require('path');
var jstoxml     = require('jstoxml');

var ylt         = require('../lib/index');

var cli = meow({
    help: [
        'Usage',
        '  yellowlabtools <url> <options>',
        '',
        'Options:',
        '  --device             Use "phone" or "tablet" to simulate a mobile device (by user-agent and viewport size).',
        '  --screenshot         Will take a screenshot and use this value as the output path. It needs to end with ".png".',
        '  --js-deep-analysis   When activated, the javascriptExecutionTree will contain sub-requests.',
        '  --wait-for-selector  Once the page is loaded, Phantomas will wait until the given CSS selector matches some elements.',
        '  --cookie             Adds a cookie on the main domain.',
        '  --auth-user          Basic HTTP authentication username.',
        '  --auth-pass          Basic HTTP authentication password.',
        '  --reporter           The output format: "json" or "xml". Default is "json".',
        ''
    ].join('\n'),
    pkg: '../package.json'
});



// Check parameters
if (cli.input.length < 1) {
    cli.showHelp();
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

// Device simulation
options.device = cli.flags.device || 'desktop';

// Wait for CSS selector
options.waitForSelector = cli.flags.waitForSelector || null;

// Cookie
options.cookie = cli.flags.cookie || null;

// HTTP basic auth
options.authUser = cli.flags.authUser || null;
options.authPass = cli.flags.authPass || null;

// Output format
if (cli.flags.reporter && cli.flags.reporter !== 'json' && cli.flags.reporter !== 'xml') {
    console.error('Incorrect parameters: reporter has to be "json" or "xml"');
    process.exit(1);
}


(function execute(url, options) {
    'use strict';

    ylt(url, options).

        then(function(data) {

            debug('Success');
            switch(cli.flags.reporter) {
                case 'xml':
                    console.log(jstoxml.toXML(data, {indent: '  '}));
                    break;
                default:
                    console.log(JSON.stringify(data, null, 2));
            }

        }).fail(function(err) {
            
            debug('Test failed for %s', url);
            console.error(err);
            
        });

    debug('Test launched...');

})(url, options);