angular.module('starter.controllers', [])

    .controller('DashCtrl', function ($scope) {
    })

    .controller('OnboardingCtrl', function ($scope, $ionicHistory, $state, Settings) {
        $scope.settings = Settings.getSettings();
        $scope.form = {
            timeValue: 50
        };
        if ($scope.settings !== null) {
            $scope.form.location = $scope.settings.location['formatted_address'];
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

    .controller('DecisionCtrl', function ($scope, $state, $cordovaGeolocation, $ionicPlatform, $ionicLoading, $ionicSlideBoxDelegate, Settings, Decision) {
        $ionicPlatform.ready(function () {
            var posOptions = {
                maximumAge: 1,
                timeout: 10000,
                enableHighAccuracy: true
            };

            $ionicLoading.show({
                template: '<i class="icon ion-loading-c"></i>'
            });

            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    $scope.currentLocation = position.coords;

                    var lat = position.coords.latitude;
                    var long = position.coords.longitude;
                    $scope.decision = {
                        fetched: false
                    };

                    Decision.getDecision(lat, long).then(function (decision) {
                        $scope.decision = decision;
                        $ionicLoading.hide();
                    });
                }, function (err) {
                    $ionicLoading.hide();
                    console.log(err);
                });

        });

        $scope.settings = Settings.getSettings();

        $scope.slideChanged = function (index) {
            if (index == 1 && $scope.decision.uber) {
                var homeLocation = Settings.getSavedLocation();

                window.open("uber://?client_id=j8Vcv9jallufZKwy_rUctVabnvRsWwXO" +
                "&action=setPickup" +
                "&pickup=my_location" +
                "&dropoff[latitude]=" + homeLocation.lat +
                "&dropoff[longitude]=" + homeLocation.lon +
                "&dropoff[nickname]=Home", '_blank');

                $ionicSlideBoxDelegate.slide(0);
            } else {

            }
        }
    });