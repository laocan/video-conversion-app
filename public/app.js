angular.module('app', ['angularFileUpload'])
    .controller("AppController", function ($scope, $http, FileUploader) {

        var uploader = $scope.uploader = new FileUploader({
            url: 'https://video-conversion-service.herokuapp.com/v1/video-upload',
            autoUpload: 'true'
        });

        uploader.onSuccessItem = function (fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);
            var inputVideoId = response['id'];

            $scope.showUploadedVideoMessage = true;
            $scope.uploadedVideoUri = response['uri'];
            console.info("Created video resource: " + inputVideoId);

            $http.post('https://video-conversion-service.herokuapp.com/v1/video-conversions',
                {
                    inputVideoId: inputVideoId,
                    outputFormat: 'mp4'
                }
            ).success(function (data, status, headers, config) {
                    var videoConversionId = data["id"];
                    console.info("Created video conversion resource: " + videoConversionId);
                }).
                error(function (data, status, headers, config) {

                });
        };

        console.info('uploader', uploader);
    })
    .factory('videoService', function($http) {
        return {
            getVideo: function(id) {
                return $http.get('https://video-conversion-service.herokuapp.com/v1/videos/' + id)
            }
        }
    });
