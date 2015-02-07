angular.module('starter.services', [])

    .factory('Settings', function () {
        return {
            getSettings: function () {
                try {
                    return JSON.parse(localStorage.getItem('user_settings'));
                } catch (e) {
                    return null;
                }
            },
            saveSettings: function (settings) {
                localStorage.setItem('user_settings', JSON.stringify(settings));
            },
            clearSettings: function () {
                localStorage.removeItem('user_settings');
            },
            getSavedLocation: function () {
                var location = this.getSettings().location.geometry.location;
                return {
                    'lat': location['k'],
                    'lon': location['D']
                }
            }
        }
    })

    .factory('Estimator', function ($http, apiRoot) {
        return {
            getEstimate: function (service, from_lat, from_lon, to_lat, to_lon) {
                var from_ll = from_lat + ',' + from_lon;
                var to_ll = to_lat + ',' + to_lon;
                var apiUrl = apiRoot + "estimate/" + service + "/" + from_ll + "/" + to_ll;
                return $http.get(apiUrl);
            }
        }
    })

    .factory('TflEstimator', function (Estimator) {
        return {
            getEstimate: function (from_lat, from_lon, to_lat, to_lon) {
                return Estimator.getEstimate('tfl', from_lat, from_lon, to_lat, to_lon).then(function (res) {
                    var data = res.data;
                    data.scoringData = {
                        duration: data.duration * 60,
                        cost: 5
                    };
                    return data;
                });
            }
        }
    })

    .factory('UberEstimator', function (Estimator) {
        return {
            getEstimate: function (from_lat, from_lon, to_lat, to_lon) {
                return Estimator.getEstimate('uber', from_lat, from_lon, to_lat, to_lon).then(function (res) {
                    var uberData = res.data;
                    var fastestUber = _.min(uberData, 'total_time_estimate');
                    fastestUber.scoringData = {
                        duration: fastestUber.total_time_estimate,
                        cost: fastestUber.high_estimate
                    };

                    return fastestUber;
                });
            }
        }
    })

    .factory('Decision', function ($http, $q, $injector, Settings) {
        var calculateScore = function (userTimeValue, scoringData) {
            var priceWeight = (100 - userTimeValue) / 100;
            return 1 / (Math.pow(scoringData.cost, priceWeight) * scoringData.duration)
        };

        return {
            getDecision: function (lat, lon) {
                var services = ['TflEstimator', 'UberEstimator'];
                var getEstimate = function (estimatorName) {
                    var homeLocation = Settings.getSavedLocation();
                    return $injector.invoke([estimatorName, function (estimator) {
                        return estimator.getEstimate(lat, lon, homeLocation.lat, homeLocation.lon);
                    }])
                };

                var promises = _.reduce(services, function (result, serviceName) {
                    result[serviceName] = getEstimate(serviceName);
                    return result;
                }, {});

                return $q.all(promises).then(function (res) {
                    var decision = {};

                    var fastestUber = res['UberEstimator'];
                    var tflData = res['TflEstimator'];

                    var userTimeValue = Settings.getSettings().timeValue;

                    var uberScore = calculateScore(userTimeValue, fastestUber.scoringData);
                    var tflScore = calculateScore(userTimeValue, tflData.scoringData);

                    if (uberScore >= tflScore) {
                        decision = {
                            uber: true
                        }
                    } else {
                        decision = {
                            uber: false,
                            alternative_text: 'Public Transport'
                        }
                    }

                    decision.fetched = true;
                    decision.debug = {
                        fastestUber: fastestUber,
                        tflData: tflData
                    };
                    console.log(Settings.getSettings());
                    console.log(decision.debug);
                    return decision;
                });
            }
        }
    });
