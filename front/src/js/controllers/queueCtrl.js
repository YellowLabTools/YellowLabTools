var queueCtrl = angular.module('queueCtrl', ['runsFactory']);

queueCtrl.controller('QueueCtrl', ['$scope', '$routeParams', '$location', 'Runs', 'API', function($scope, $routeParams, $location, Runs, API) {
    $scope.runId = $routeParams.runId;

    var numberOfTries = 0;
    
    var favicon = document.querySelector('link[rel=icon]');
    var faviconUrl = 'img/favicon.png';
    var faviconSuccessUrl = 'img/favicon-success.png';
    var faviconFailUrl = 'img/favicon-fail.png';
    var faviconInterval = null;
    var faviconCounter = 0;
    var faviconCanvas = null;
    var faviconCanvasContext = null;
    var faviconImage = null;
    
    function getRunStatus () {
        Runs.get({runId: $scope.runId}, function(data) {
            $scope.url = data.params.url;
            $scope.status = data.status;
            $scope.progress = data.progress;
            $scope.notFound = false;
            $scope.connectionLost = false;

            if (data.status.statusCode === 'awaiting') {
                numberOfTries ++;
                rotateFavicon();

                // Retrying every 2 seconds (and increasing the delay a bit more each time)
                setTimeout(getRunStatus, 2000 + (numberOfTries * 100));

            } else if (data.status.statusCode === 'running') {
                numberOfTries ++;
                rotateFavicon();

                // Retrying every second or so
                setTimeout(getRunStatus, 1000 + (numberOfTries * 10));

            } else if (data.status.statusCode === 'complete') {
                stopFavicon(true);

                $location.path('/result/' + $scope.runId).replace();
            } else {
                stopFavicon(false);

                // The rest is handled by the view
            }
        }, function(response) {
            if (response.status === 404) {
                stopFavicon(false);
                $scope.notFound = true;
                $scope.connectionLost = false;
            } else if (response.status === 0) {
                // Connection lost, retry in 10 seconds
                setTimeout(getRunStatus, 10000);
                $scope.connectionLost = true;
                $scope.notFound = false;
            }
        });
    }

    function rotateFavicon() {
        if (!faviconInterval) {
            faviconImage = new Image();
            faviconImage.onload = function() {
                faviconCanvas = document.getElementById('faviconRotator');
                faviconCanvasContext = faviconCanvas.getContext('2d');
                faviconCanvasContext.fillStyle = '#212240';
                
                if (!!faviconCanvasContext) {
                    faviconInterval = window.setInterval(faviconTick, 300);
                }
            };
            faviconImage.src = faviconUrl;
        }
    }

    function faviconTick() {
        faviconCounter ++;
        faviconCanvasContext.save();
        faviconCanvasContext.fillRect(0, 0, 32, 32);
        faviconCanvasContext.translate(16, 16);
        faviconCanvasContext.rotate(22.5 * faviconCounter * Math.PI / 180);
        faviconCanvasContext.translate(-16, -16);
        faviconCanvasContext.drawImage(faviconImage, 0, 0, 32, 32);
        faviconCanvasContext.restore();
        favicon.href = faviconCanvas.toDataURL('image/png');
    }

    function stopFavicon(isSuccess) {
        window.clearInterval(faviconInterval);
        faviconInterval = null;
        favicon.href = isSuccess ? faviconSuccessUrl : faviconFailUrl;
    }
    
    getRunStatus();
}]);

    