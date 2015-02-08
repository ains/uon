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

    .factory('TflEstimator', function ($http, Estimator) {
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
            },
            getBoundingBox: function () {
                return $http.get('js/polygons/london.json').then(function (res) {
                    return res.data;
                });
            }
        }
    })

    .factory('UberEstimator', function (Estimator) {
        return {
            getEstimate: function (from_lat, from_lon, to_lat, to_lon) {
                return Estimator.getEstimate('uber', from_lat, from_lon, to_lat, to_lon).then(function (res) {
                    var uberData = _.filter(res.data, function (estimate) {
                        return estimate.high_estimate != null;
                    });
                    var cheapestUber = _.min(uberData, 'high_estimate');
                    cheapestUber.scoringData = {
                        duration: cheapestUber.total_time_estimate,
                        cost: cheapestUber.high_estimate
                    };

                    return cheapestUber;
                });
            }
        }
    })

    .factory('MultiLegEstimator', function ($q, UberEstimator) {
        return {
            getEstimate: function (estimator, from_lat, from_lon, to_lat, to_lon, leg_data) {
                var lastUberableLeg = _.last(_.takeWhile(leg_data, 'uberable'));
                var lastLeg = _.last(leg_data);

                if (lastLeg == lastUberableLeg) {
                    return null;
                } else {
                    var uber_end_lat = lastUberableLeg.arrival_point.lat;
                    var uber_end_lon = lastUberableLeg.arrival_point.lon;

                    var uberLeg = UberEstimator.getEstimate(from_lat, from_lon, uber_end_lat, uber_end_lon);
                    var remainderLeg = estimator.getEstimate(uber_end_lat, uber_end_lon, to_lat, to_lon);

                    return $q.all([uberLeg, remainderLeg]).then(function (res) {
                        var uberData = res[0];
                        var remainderData = res[1];

                        return {
                            uberData: uberData,
                            remainderData: remainderData,
                            scoringData: {
                                duration: uberData.scoringData.duration + remainderData.scoringData.duration,
                                cost: uberData.scoringData.cost + remainderData.scoringData.cost
                            }
                        };
                    });
                }
            }
        }
    })

    .factory('Decision', function ($http, $q, $injector, Settings, MultiLegEstimator) {
        var calculateScore = function (userTimeValue, scoringData) {
            var priceWeight = (100 - userTimeValue) / 100;
            return 1 / (Math.pow(scoringData.cost, priceWeight) * scoringData.duration)
        };

        return {
            getDecision: function (lat, lon) {
                var homeLocation = Settings.getSavedLocation();
                var services = ['TflEstimator'];

                var getEstimate = function (estimatorName) {
                    return $injector.invoke([estimatorName, function (estimator) {
                        return estimator
                            .getEstimate(lat, lon, homeLocation.lat, homeLocation.lon)
                            .then(function (estimate) {
                                return {
                                    estimator: estimator,
                                    estimate: estimate
                                }
                            })
                    }])
                };

                var validServicePromises = _.map(services, function (serviceName) {
                    return $injector.invoke([serviceName, function (estimator) {
                        return estimator.getBoundingBox().then(function (boundingBox) {
                            return {
                                'name': serviceName,
                                'boundingBox': boundingBox
                            };
                        });
                    }]);
                });

                return $q.all(validServicePromises).then(function (validServices) {
                    return _.pluck(_.filter(validServices, function (service) {
                        return gju.pointInPolygon({"type": "Point", "coordinates": [lon, lat]}, service.boundingBox);
                    }), 'name');
                }).then(function (validServices) {
                    console.log(validServices);
                    var promises = _.map(['UberEstimator'].concat(validServices), getEstimate);
                    return $q.all(promises).then(function (res) {
                        var decision = {};

                        var uberData = res.shift();

                        var multiHopPromises = [];
                        _.forEach(res, function (estimatorResult) {
                            if (estimatorResult.estimate.multi_leg) {
                                var partialEstimate = MultiLegEstimator.getEstimate(
                                    estimatorResult.estimator, lat, lon,
                                    homeLocation.lat, homeLocation.lon, estimatorResult.estimate.legs);
                                if (partialEstimate != null) {
                                    var promise = partialEstimate.then(function (estimate) {
                                        return {
                                            estimator: estimatorResult.estimator,
                                            estimate: estimate
                                        }
                                    });
                                    multiHopPromises.push(promise);
                                }
                            }
                        });

                        return $q.all(multiHopPromises).then(function (mhResults) {
                            var estimates = _.compact(res.concat(mhResults));
                            var userTimeValue = Settings.getSettings().timeValue;

                            var bestEstimate = _.max(estimates, function (estimatorResult) {
                                return calculateScore(userTimeValue, estimatorResult.estimate.scoringData);
                            });

                            var uberScore = calculateScore(userTimeValue, uberData.estimate.scoringData);
                            var estimateScore = calculateScore(userTimeValue, bestEstimate.estimate.scoringData);

                            if (uberScore >= estimateScore) {
                                decision = {
                                    uber: true
                                }
                            } else {
                                decision = {
                                    uber: false,
                                    alternative_text: 'Public Transport',
                                    data: bestEstimate.estimate
                                }
                            }

                            decision.fetched = true;
                            decision.debug = {
                                uberData: uberData,
                                estimates: estimates,
                                bestEstimate: bestEstimate
                            };
                            console.log(decision.debug);
                            return decision;
                        });


                    });
                });


            }
        }
    });
