var UiController = function(app) {
    'use strict';


    // Create a new run
    app.get('/', function(req, res) {

        res.setHeader('Content-Type', 'text/html');
        res.send('Test');
    });
};

module.exports = UiController;