import requests


class TFLService():
    NAME = "tfl"
    API_BASE_URL = "http://api.tfl.gov.uk/"

    def __init__(self, app_id, app_key):
        self.app_id = app_id
        self.app_key = app_key

    def make_request(self, from_ll, to_ll):
        request_uri = "{}Journey/JourneyResults/{}/to/{}/".format(
            self.API_BASE_URL,
            from_ll,
            to_ll
        )
        params = {
            'app_id': self.app_id,
            'app_key': self.app_key
        }
        return requests.get(request_uri, params=params).json()

    @staticmethod
    def extract_route(resp):
        extract_leg = lambda leg: {
            'duration': leg['duration'],
            'summary': leg['instruction']['summary'],
            'mode': leg['mode']['id'],
            'uberable': (
                leg['mode']['id'] == "walking" or leg['mode']['id'] == "bus")
        }
        extract_journey = lambda journey: {
            'duration': journey['duration'],
            'legs': map(extract_leg,
                        journey['legs'])
        }

        return extract_journey(resp['journeys'][0])

    def get_estimate(self, from_ll, to_ll):
        return self.extract_route(self.make_request(from_ll, to_ll))