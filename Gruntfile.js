module.exports = function(grunt) {

    // Load all grunt modules
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Tell our Express server that Grunt launched it
    process.env.GRUNTED = true;

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        settings: grunt.file.readJSON('./server_config/settings.json'),
        
        webfont: {
            icons: {
                src: 'front/src/fonts/svg-icons/*.svg',
                dest: 'tmp',
                destCss: 'front/src/less',
                options: {
                    engine: 'node',
                    types: 'woff',
                    stylesheet: 'less',
                    embed: true,
                    htmlDemo: false,
                    syntax: 'bootstrap'
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
                        },
                        {
                            match: 'version',
                            replacement: 'v<%= pkg.version %>'
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
                'test/api/*.js',
                'test/core/*.js',
                'test/fixtures/*.js',
                'front/src/js/**/*.js'
            ]
        },
        clean: {
            tmp: {
                src: ['.tmp']
            },
            dev: {
                src: ['front/src/css']
            },
            build: {
                src: ['front/build']
            }
        },
        copy: {
            build: {
                files: [
                    {src: ['./front/src/img/favicon.png'], dest: './front/build/img/favicon.png'},
                    {src: ['./front/src/img/logo-large.png'], dest: './front/build/img/logo-large.png'},
                ]
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                },
                src: ['test/core/*.js', 'test/api/*.js']
            },
            'test-current-work': {
                options: {
                    reporter: 'spec',
                },
                src: ['test/api/apiTest.js']
            }
        },
        env: {
            dev: {
                NODE_ENV: 'development'
            },
            built: {
                NODE_ENV: 'production'
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
            built: {
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
                    server: './bin/server.js',
                    showStack: true
                }
            },
            'test-current-work': {
                options: {
                    port: 8387,
                    server: './bin/server.js',
                    showStack: true
                }
            },
            testSuite: {
                options: {
                    port: 8388,
                    bases: 'test/www'
                }
            }
        },
        useminPrepare: {
            html: './front/src/main.html',
            options: {
                dest: './front/build',
                root: ['./', './front/src']
            }
        },
        usemin: {
            html: './front/build/main.html',
            css: './front/build/css/*.css',
            options: {
                assetsDirs: ['front/build']
            }
        },
        htmlmin: {
            options: {
                removeComments: true,
                collapseWhitespace: true,
                conservativeCollapse: true
            },
            main: {
                files: [{
                    expand: true,
                    cwd: './front/build/',
                    src: 'main.html',
                    flatten: true,
                    dest: './front/build'
                }]
            },
            views: {
                files: [{
                    expand: true,
                    cwd: './front/src/views',
                    src: '*.html',
                    flatten: true,
                    dest: '.tmp/views/'
                }]
            }
        },
        inline_angular_templates: {
            build: {
                options: {
                    base: '.tmp',
                    method: 'append',
                    unescape: {
                        '&lt;': '<',
                        '&gt;': '>'
                    }
                },
                files: {
                    './front/build/main.html': ['.tmp/views/*.html']
                }
            }
        },
        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            assets: {
                src: './front/build/*/*.*'
            }
        }
    });

    // Custom task that sets a variable for tests
    grunt.registerTask('test-settings', function() {
        process.env.IS_TEST = true;
    });

    grunt.registerTask('icons', [
        'webfont:icons',
        'less',
        'clean:tmp'
    ]);

    grunt.registerTask('build', [
        'jshint',
        'clean:build',
        'copy:build',
        'less',
        'useminPrepare',
        'concat',
        'uglify',
        'cssmin',
        'replace',
        'htmlmin:views',
        'inline_angular_templates',
        'filerev',
        'usemin',
        'htmlmin:main',
        'clean:tmp'
    ]);

    grunt.registerTask('hint', [
        'jshint'
    ]);

    grunt.registerTask('dev', [
        'env:dev',
        'express:dev'
    ]);

    grunt.registerTask('built', [
        'env:built',
        'express:built'
    ]);

    grunt.registerTask('test', [
        'test-settings',
        'build',
        'express:testSuite',
        'express:test',
        'mochaTest:test',
        'clean:tmp'
    ]);

    grunt.registerTask('test-current-work', [
        'test-settings',
        'jshint',
        'express:testSuite',
        'express:test-current-work',
        'mochaTest:test-current-work',
        'clean:tmp'
    ]);

};