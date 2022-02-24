#!/usr/bin/env node

var debug       = require('debug')('ylt:cli');
var meow        = require('meow');
var path        = require('path');
var EasyXml     = require('easyxml');

var ylt         = require('../lib/index');

var cli = meow({
    help: [
        'Usage',
        '  yellowlabtools <url> <options>',
        '',
        'Options:',
        '  --device             Simulates a device. Choose between phone (default), tablet, desktop and desktop-hd.',
        '  --screenshot         Will take a screenshot and use this value as the output path. It needs to end with ".png".',
        //'  --wait-for-selector  Once the page is loaded, Phantomas will wait until the given CSS selector matches some elements.',
        '  --proxy              Sets an HTTP proxy to pass through. Syntax is "host:port".',
        '  --cookie             Adds a cookie on the main domain.',
        '  --auth-user          Basic HTTP authentication username.',
        '  --auth-pass          Basic HTTP authentication password.',
        '  --block-domain       Disallow requests to given (comma-separated) domains.',
        '  --allow-domain       Only allow requests to given (comma-separated) domains.',
        '  --no-externals       Block all domains except the main one.',
        '  --reporter           The output format: "json" or "xml". Default is "json".',
        '  --local-storage      Ability to set a local storage, key-value pairs (e.g. "bar=foo;domain=url")',
        '  --session-storage    Ability to set a session storage, key-value pairs (e.g. "bar=foo;domain=url")',
        ''
    ].join('\n'),
    pkg: require('../package.json')
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

// Device simulation
options.device = cli.flags.device || 'mobile';

// Wait for CSS selector
options.waitForSelector = cli.flags.waitForSelector || null;

// Proxy
options.proxy = cli.flags.proxy || null;

// Cookie
options.cookie = cli.flags.cookie || null;

// HTTP basic auth
options.authUser = cli.flags.authUser || null;
options.authPass = cli.flags.authPass || null;

// Domain blocking
options.blockDomain =  cli.flags.blockDomain || null;
options.allowDomain =  cli.flags.allowDomain || null;
options.noExternals =  cli.flags.noExternals || null;

// Storage injection
options.localStorage = cli.flags.localStorage;
options.sessionStorage = cli.flags.sessionStorage;

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
                    var serializer = new EasyXml({
                        manifest: true
                    });

                    // Remove some heavy parts of the results object
                    delete data.toolsResults;
                    delete data.javascriptExecutionTree;

                    var xmlOutput = serializer.render(data);

                    // Remove special chars from XML tags: # [ ]
                    xmlOutput = xmlOutput.replace(/<([^>]*)#([^>]*)>/g, '<$1>');
                    xmlOutput = xmlOutput.replace(/<([^>]*)\[([^>]*)>/g, '<$1>');
                    xmlOutput = xmlOutput.replace(/<([^>]*)\]([^>]*)>/g, '<$1>');

                    // Remove special chars from text content: \n \0
                    xmlOutput = xmlOutput.replace(/(<[a-zA-Z]*>[^<]*)\n([^<]*<\/[a-zA-Z]*>)/g, '$1$2');
                    xmlOutput = xmlOutput.replace(/\0/g, '');
                    xmlOutput = xmlOutput.replace(/\uFFFF/g, '');
                    xmlOutput = xmlOutput.replace(/\u0002/g, '');

                    console.log(xmlOutput);
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