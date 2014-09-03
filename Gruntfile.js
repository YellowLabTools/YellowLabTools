module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
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