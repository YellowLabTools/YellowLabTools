module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        font: {
            icons: {
                src: ['app/public/fonts/svg-icons/*.svg'],
                destCss: 'app/public/styles/less/icons.less',
                destFonts: 'app/public/fonts/icons.woff',

                // Optional: Custom routing of font filepaths for CSS
                cssRouter: function (fontpath) {
                    var pathArray = fontpath.split('/');
                    var fileName = pathArray[pathArray.length - 1];
                    return '/public/fonts/' + fileName;
                }
            }
        },
        less: {
            icons: {
                files: {
                    'app/public/styles/main.css': [ 'app/public/styles/less/main.less' ],
                    'app/public/styles/index.css': [ 'app/public/styles/less/index.less' ],
                    'app/public/styles/launchTest.css': [ 'app/public/styles/less/launchTest.less' ],
                    'app/public/styles/results.css': [ 'app/public/styles/less/results.less' ]
                }
            }
        },
        jshint: {
            all: [
                '*.js',
                'app/lib/*',
                'app/nodeControllers/*.js',
                'app/public/scripts/*.js',
                'phantomas_custom/**/*.js'
            ]
        },
        clean: {
            icons: {
                src: ['tmp']
            },
            coverage: {
                src: ['coverage/']
            }
        },
        copy: {
            coverage: {
                src: ['test/**'],
                dest: 'coverage/'
            }
        },
        blanket: {
            coverage: {
                src: ['app/'],
                dest: 'coverage/app/'
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                },
                src: ['coverage/test/server/*.js']
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    // use the quiet flag to suppress the mocha console output
                    quiet: true,
                    // specify a destination file to capture the mocha
                    // output (the quiet option does not suppress this)
                    captureFile: 'coverage/coverage.html'
                },
                src: ['coverage/test/server/*.js']
            }
        }
    });

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.registerTask('build', [
        'jshint',
        'font:icons',
        'less:icons',
        'clean:icons'
    ]);

    grunt.registerTask('hint', [
        'jshint'
    ]);

    grunt.registerTask('test', [
        'clean:coverage',
        'blanket',
        'copy:coverage',
        'mochaTest'
    ]);

};