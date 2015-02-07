angular.module('starter.controllers', [])

    .controller('DashCtrl', function ($scope) {
    })

    .controller('OnboardingCtrl', function ($scope, $ionicHistory, $state, Settings) {
        $scope.settings = Settings.getSettings();
        $scope.form = {};
        console.log($scope.settings);
        if ($scope.settings !== null) {
            $scope.form.location = $scope.settings.location;
            $scope.form.timeValue = $scope.settings.timeValue;
        }

        $scope.saveSettings = function () {
            Settings.saveSettings({
                'location': $scope.form.location,
                'timeValue': $scope.form.timeValue
            });

            $ionicHistory.nextViewOptions({
                disableBack: true
            });

            $state.go('decision', {});
        };

        $scope.clearSettings = function () {
            Settings.clearSettings();
            $scope.settings = null;
        };
    })

    .controller('DecisionCtrl', function ($scope, $state, $cordovaGeolocation, $ionicPlatform, Settings) {
        $ionicPlatform.ready(function () {
            var posOptions = {timeout: 10000, enableHighAccuracy: true};
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat = position.coords.latitude;
                    var long = position.coords.longitude;
                    $scope.lat = lat;
                    $scope.lon = long;
                }, function (err) {
                    // error
                });

        });
        $scope.settings = Settings.getSettings();
    });