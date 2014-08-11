/**
 * Socket.io handler
 */

var fs = require('fs');

var waitingQueueSocket = function(socket, testQueue) {
    
    socket.on('waiting', function(testId) {
        console.log('User waiting for test id ' + testId);

        sendTestStatus(testId);

        testQueue.on('testComplete', function(id) {
            if (testId === id) {
                socket.emit('complete');
                console.log('Sending complete event to test id ' + testId);
            }
        });

        testQueue.on('testFailed', function(id) {
            if (testId === id) {
                socket.emit('failed');
                console.log('Sending failed event to test id ' + testId);
            }
        });

        testQueue.on('queueMoving', function() {
            var positionInQueue = testQueue.indexOf(testId);
            if (positionInQueue >= 0) {
                socket.emit('position', positionInQueue);
                console.log('Sending position to test id ' + testId);
            }
        });
    });

    // Finds the status of a test and send it to the client
    function sendTestStatus(testId) {
        // Check task position in queue
        var positionInQueue = testQueue.indexOf(testId);

        if (positionInQueue >= 0) {
            socket.emit('position', positionInQueue);
        } else {
            // Find in results files
            var exists = fs.exists('results/' + testId + '/results.json', function(exists) {
                if (exists) {
                    // TODO : find a way to make sure the file is completely written
                    setTimeout(function() {
                        socket.emit('complete');
                    }, 4000);
                } else {
                    socket.emit('404');
                }
            });
        }
    }
};

module.exports = waitingQueueSocket;