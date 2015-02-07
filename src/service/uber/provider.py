from django.conf import settings
from service import UberService


def get_service():
    return UberService(settings.UBER_SERVER_TOKEN)