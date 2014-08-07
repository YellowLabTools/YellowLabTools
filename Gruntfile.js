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
        }
    });

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


    grunt.registerTask('hint', ['jshint']);

};