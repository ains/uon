"""
WSGI config for uon project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.7/howto/deployment/wsgi/
"""

import os
from dj_static import Cling

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "uon.settings")

from django.core.wsgi import get_wsgi_application
application = Cling(get_wsgi_application())
