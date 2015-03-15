"use strict";

function serviceUrl(path) {
    return "https://video-conversion-service.herokuapp.com/v1/" + path
}

angular

    .module("app", ["angularFileUpload"])

    .controller("AppController", function ($scope, $log, $http, $interval, $sce, service, FileUploader) {

        var uploader = $scope.uploader = new FileUploader({
            url: serviceUrl("video-upload"),
            autoUpload: true,
            removeAfterUpload: true
        });

        FileUploader.FileSelect.prototype.isEmptyAfterSelection = function() {
            return true;
        };

        uploader.onBeforeUploadItem = function() {
            $scope.showUploadProgress = true;
            $scope.showUploadedVideoMessage = false;
            $scope.showVideoConversion = false;
            $scope.showConvertedVideo = false;
        };

        uploader.onSuccessItem = function (fileItem, response) {
            var inputVideoId = response["id"];
            var inputVideoUri = response["uri"];

            $scope.showUploadProgress = false;
            $scope.showUploadedVideoMessage = true;
            $scope.uploadedVideoUri = inputVideoUri;

            service.createVideoConversion({ inputVideoId: inputVideoId, outputFormat: "mp4" }).then(
                function (response) {
                    $scope.videoConversionId = response.data.id;
                },
                function (error) {
                   $log.error("could not create video conversion job.", error);
                });

            var promise = $interval(function () {
                service.getVideoConversion($scope.videoConversionId).then(
                    function (response) {
                        $scope.showVideoConversion = true;
                        $scope.videoConversionStatus = response.data.status;
                        $scope.videoConversionProgress = response.data.progress;
                        $scope.outputVideoId = response.data.outputVideoId;

                        var status = $scope.videoConversionStatus;
                        if (status == "finished" || status == "cancelled" || status == "failed") {
                            $interval.cancel(promise);
                            onVideoConversionFinished(status);
                        }
                    },
                    function (error) {
                        $log.error("could not get video conversion job.", error);
                    });
            }, 1000);
        };

        function onVideoConversionFinished(status) {
            if (status == "finished") {
                service.getVideo($scope.outputVideoId).then(
                    function (response) {
                        $scope.showConvertedVideo = true;
                        $scope.convertedVideoUri = $sce.trustAsResourceUrl(response.data.uri);
                    },
                    function (error) {
                        $log.error("could not get video.", error);
                    }
                );
            }
        }
    })

    .factory("service", function ($http) {
        return {
            getVideo: function (id) {
                return $http.get(serviceUrl("videos/" + id))
            },
            getVideoConversion: function (id) {
                return $http.get(serviceUrl("video-conversions/" + id))
            },
            createVideoConversion: function (payload) {
                return $http.post(serviceUrl("video-conversions"), payload)
            }
        }
    });
