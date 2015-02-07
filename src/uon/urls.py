from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

import api


urlpatterns = patterns('',
                       url(r'^$', 'web.views.index', name='index'),
                       url(r'^api/', include(api.router.urls)),
                       url(r'^accounts/login/$',
                           'django.contrib.auth.views.login',
                           {'template_name': 'web/login.html'}, name='login'),
                       url(r'^accounts/logout/$',
                           'django.contrib.auth.views.logout_then_login',
                           name='logout'),

                       url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()