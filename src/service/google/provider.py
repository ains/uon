from django.conf import settings
from service import GoogleService


def get_service():
    return GoogleService(settings.GOOGLE_JOURNEY_API_KEY)