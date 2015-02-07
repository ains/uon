from django.conf import settings
from service import TFLService


def get_service():
    return TFLService(settings.TFL_APP_ID, settings.TFL_APP_KEY)