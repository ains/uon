import requests


class GoogleService():
    NAME = "google"
    API_BASE_URL = "https://maps.googleapis.com/maps/api/directions/json"

    def __init__(self, server_key):
        self.server_key = server_key

    def make_request(self, from_ll, to_ll):
        params = {
            'origin': from_ll,
            'destination': to_ll,
            'mode': 'transit',
            'key': self.server_key,
        }
        return requests.get(self.API_BASE_URL, params=params).json()

    @staticmethod
    def is_uberable(leg):
        return (
            leg['travel_mode'] == "WALKING"
        )

    @staticmethod
    def extract_route(resp):
        extract_leg = lambda leg: {
            'duration': leg['duration']['value'],
            'summary': leg['html_instructions'],
            'mode': leg['travel_mode'],
            'uberable': GoogleService.is_uberable(leg),
            'arrival_point': {
                'lat': leg['end_location']['lat'],
                'lon': leg['end_location']['lng']
            }
        }
        extract_journey = lambda journey: {
            'duration': journey['duration']['value'],
            'legs': map(extract_leg,
                        journey['steps']),
            'multi_leg': True
        }

        return extract_journey(resp['routes'][0]['legs'][0])

    def get_estimate(self, from_ll, to_ll):
        return self.extract_route(self.make_request(from_ll, to_ll))