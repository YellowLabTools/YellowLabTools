module.exports = function(grunt) {

    // Tell our Express server that Grunt launched it
    process.env.GRUNTED = true;

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        settings: grunt.file.readJSON('./server_config/settings.json'),
        
        font: {
            icons: {
                src: ['front/src/fonts/svg-icons/*.svg'],
                destCss: 'front/src/less/icons.less',
                destFonts: 'front/src/fonts/icons.woff',

                // Optional: Custom routing of font filepaths for CSS
                cssRouter: function (fontpath) {
                    var pathArray = fontpath.split('/');
                    var fileName = pathArray[pathArray.length - 1];
                    return '/front/fonts/' + fileName;
                }
            }
        },
        less: {
            all: {
                files: [
                    {
                        expand: true,
                        cwd: 'front/src/less/',
                        src: ['**/*.less'],
                        dest: 'front/src/css/',
                        ext: '.css'
                    }
                ]
            }
        },
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: 'googleAnalyticsId',
                            replacement: '<%= settings.googleAnalyticsId %>'
                        }
                    ]
                },
                files: [
                    {expand: true, flatten: true, src: ['front/src/main.html'], dest: 'front/build/'}
                ]
            }
        },
        jshint: {
            all: [
                '*.js',
                'app/lib/*.js',
                'bin/*.js',
                'lib/**/*.js',
                'app/nodeControllers/*.js',
                'app/public/scripts/*.js',
                'phantomas_custom/**/*.js',
                'test/**/*.js',
                'front/src/js/**/*.js'
            ]
        },
        clean: {
            icons: {
                src: ['tmp']
            },
            dev: {
                src: ['front/src/css']
            },
            coverage: {
                src: ['coverage/']
            }
        },
        copy: {
            coverage: {
                files: [
                    {src: ['test/**'], dest: 'coverage/'},
                    {src: ['lib/metadata/**'], dest: 'coverage/'},
                    {src: ['bin/**'], dest: 'coverage/'}
                ]
            }
        },
        blanket: {
            coverageApp: {
                src: ['app/'],
                dest: 'coverage/app/'
            },
            coverageLib: {
                src: ['lib/'],
                dest: 'coverage/lib/'
            },
            coverageBin: {
                src: ['bin/'],
                dest: 'coverage/bin/'
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                },
                src: ['coverage/test/core/*.js', 'coverage/test/api/*.js']
            },
            'test-current-work': {
                options: {
                    reporter: 'spec',
                },
                src: ['coverage/test/api/apiTest.js']
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'coverage/coverage.html'
                },
                src: ['coverage/test/core/*.js', 'coverage/test/api/*.js']
            }
        },
        express: {
            dev: {
                options: {
                    port: 8383,
                    server: './bin/server.js',
                    serverreload: true,
                    showStack: true
                }
            },
            test: {
                options: {
                    port: 8387,
                    server: './coverage/bin/server.js',
                    showStack: true
                }
            },
            testSuite: {
                options: {
                    port: 8388,
                    bases: 'test/www'
                }
            }
        }
    });


    // Custom task: copies the test settings.json file to the coverage folder, and checks if there's no missing fields
    grunt.registerTask('copy-test-server-settings', function() {
        var mainSettingsFile = './server_config/settings.json';
        var testSettingsFile = './test/fixtures/settings.json';

        var mainSettings = grunt.file.readJSON(mainSettingsFile);
        var testSettings = grunt.file.readJSON(testSettingsFile);

        // Recursively compare keys of two objects (not the values)
        function compareKeys(original, copy, context) {
            for (var key in original) {
                if (!copy[key] && copy[key] !== '' && copy[key] !== 0) {
                    grunt.fail.warn('Settings file ' + testSettingsFile + ' doesn\'t contain key ' + context + '.' + key);
                }
                if (original[key] !== null && typeof original[key] === 'object') {
                    compareKeys(original[key], copy[key], context + '.' + key);
                }
            }
        }

        compareKeys(mainSettings, testSettings, 'settings');

        var outputFile = './coverage/server_config/settings.json';
        grunt.file.write(outputFile, JSON.stringify(testSettings, null, 4));
        grunt.log.ok('File ' + outputFile + ' created');
    });




    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.registerTask('icons', [
        'font:icons',
        'less',
        'clean:icons'
    ]);

    grunt.registerTask('build', [
        'less',
        'replace'
    ]);

    grunt.registerTask('hint', [
        'jshint'
    ]);

    grunt.registerTask('dev', [
        'express:dev'
    ]);

    grunt.registerTask('test', [
        'build',
        'jshint',
        'express:testSuite',
        'clean:coverage',
        'copy-test-server-settings',
        'blanket',
        'copy:coverage',
        'express:test',
        'mochaTest:test',
        'mochaTest:coverage'
    ]);

    grunt.registerTask('test-current-work', [
        'build',
        'jshint',
        'express:testSuite',
        'clean:coverage',
        'copy-test-server-settings',
        'blanket',
        'copy:coverage',
        'mochaTest:test-current-work'
    ]);

};