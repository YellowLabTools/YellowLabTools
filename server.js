var fs          = require('fs');
var async       = require('async');
var express     = require('express');
var app         = express();
var server      = require('http').createServer(app);
var io          = require('socket.io').listen(server);
var bodyParser  = require('body-parser');
var phantomas   = require('phantomas');


app.use(bodyParser.urlencoded({ extended: false }));


// Home page
app.get('/', function(req, res) {
    async.parallel({
        
        htmlTemplate: function(callback) {
            fs.readFile('./app/views/index.html', {encoding: 'utf8'}, callback);
        }

    }, function(err, results) {
        res.setHeader('Content-Type', 'text/html');
        res.send(results.htmlTemplate);
    });
});

// Waiting queue page
app.post('/launchTest', function(req, res) {
    // Generate test id
    var testId = (Date.now()*1000 + Math.round(Math.random()*1000)).toString(36);

    var resultsPath = 'results/' + testId;
    var phantomasResultsPath = resultsPath + '/results.json';
    
    var url = req.body.url;
    if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
        url = 'http://' + url;
    }

    async.waterfall([
        
        function htmlTemplate(callback) {
            fs.readFile('./app/views/launchTest.html', {encoding: 'utf8'}, callback);
        },

        function sendResponse(html, callback) {

            html = html.replace('%%TEST_URL%%', url);
            html = html.replace('%%TEST_ID%%', testId);

            res.setHeader('Content-Type', 'text/html');
            res.send(html);

            callback();
        },

        function createFolder(callback) {
            // Create results folder
            fs.mkdir(resultsPath, callback);
        },

        function executePhantomas(callback) {

            var options = {
                timeout: 60,
                'js-execution-tree': true,
                reporter: 'json:pretty'
            };

            console.log('Adding test ' + testId + ' on ' + url + ' to the queue');
            
            var task = {
                testId: testId,
                url: url,
                options: options
            };

            console.log(JSON.stringify(task, null, 4));

            taskQueue.push(task, callback);
        },

        function writeResults(json, resultsObject, callback) {
            console.log('Saving Phantomas results file to ' + phantomasResultsPath);
            fs.writeFile(phantomasResultsPath, JSON.stringify(json, null, 4), callback);
        }

    ], function(err) {
        if (err) {
            console.log('An error occured while launching the phantomas test : ', err);

            fs.writeFile(phantomasResultsPath, JSON.stringify({url: url, error: err}, null, 4), function(err) {
                if (err) {
                    console.log('Could not even write an error message on file ' + phantomasResultsPath);
                    console.log(err);
                }
            });
        }
    });
});


// Results page
app.get('/results/:testId', function(req, res) {
    
    var testId = req.params.testId;
    var resultsPath = 'results/' + testId;
    var phantomasResultsPath = resultsPath + '/results.json';

    console.log('Opening test ' + testId + ' results as HTML');

    async.parallel({
        
        htmlTemplate: function(callback) {
            fs.readFile('./app/views/results.html', {encoding: 'utf8'}, callback);
        },

        phantomasResults: function(callback) {
            fs.readFile(phantomasResultsPath, {encoding: 'utf8'}, callback);
        }

    }, function(err, results) {
        if (err) {
            console.log(err);
            return res.status(404).send('Sorry, test not found...');
        }

        var html = results.htmlTemplate;
        html = html.replace('%%RESULTS%%', results.phantomasResults);

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    });
});


// Static files
app.use('/public', express.static(__dirname + '/app/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));


// Socket.io
io.on('connection', function(socket){
    socket.on('waiting', function(testId) {
        console.log('User waiting for test id ' + testId);
        socket.testId = testId;

        // Check task position in queue
        var positionInQueue = -1;
        if (taskQueue.length() > 0) {
            taskQueue.tasks.forEach(function(task, index) {
                if (task.data.testId === testId) {
                    positionInQueue = index;
                }
            });
        }

        if (positionInQueue >= 0) {
            socket.emit('position', positionInQueue);
        } else if (currentTask && currentTask.testId === testId) {
            socket.emit('running');
        } else {
            // Find in results files
            var exists = fs.exists('results/' + testId + '/results.json', function(exists) {
                if (exists) {
                    // TODO : use eventEmitter to make sure the file is completly written on disk
                    setTimeout(function() {
                        socket.emit('complete');
                    }, 1000);
                } else {
                    socket.emit('404');
                }
            });
        }
    });
});


// Creating a queue and defining the worker function
var currentTask = null;
var taskQueue = async.queue(function queueWorker(task, callback) {

    currentTask = task;
    console.log('Starting test ' + task.testId);
    
    // It's time to launch the test!!!
    phantomas(task.url, task.options, function(err, json, results) {
        console.log('Test ' + task.testId + ' complete');
        currentTask = null;
        callback(err, json, results);
    });

});


// Launch the server
server.listen(8383, function() {
    console.log('Listening on port %d', server.address().port);
});