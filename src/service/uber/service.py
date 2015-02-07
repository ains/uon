import requests


class UberService():
    NAME = "uber"
    API_BASE_URL = "https://api.uber.com/v1/"

    def __init__(self, server_token):
        self.server_token = server_token

    def make_request(self, from_ll, to_ll):
        price_request_uri = "{}estimates/price".format(self.API_BASE_URL)
        time_request_uri = "{}estimates/time".format(self.API_BASE_URL)

        start_lat, start_lon = from_ll.split(',', 2)
        end_lat, end_lon = to_ll.split(',', 2)
        params = {
            'start_latitude': float(start_lat),
            'start_longitude': float(start_lon),
            'end_latitude': float(end_lat),
            'end_longitude': float(end_lon)
        }

        headers = {
            'Authorization': 'Token {}'.format(self.server_token)
        }
        price_estimates = requests.get(price_request_uri, params=params,
                                       headers=headers).json()
        time_estimates = requests.get(time_request_uri, params=params,
                                      headers=headers).json()

        estimates = price_estimates['prices']
        for estimate in estimates:
            # Add time estimate for given product ID
            for time_estimate in time_estimates['times']:
                if time_estimate['product_id'] == estimate['product_id']:
                    estimate['total_time_estimate'] = estimate['duration'] + time_estimate['estimate']

        return estimates

    def get_estimate(self, from_ll, to_ll):
        return self.make_request(from_ll, to_ll)