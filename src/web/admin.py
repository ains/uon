from django.contrib import admin
from web.models import User

admin.autodiscover()
admin.site.register(User)
