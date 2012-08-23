from django.conf.urls.defaults import patterns, include, url
import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'photos.views.index', name='home'),
    url(r'^about/$', 'photos.views.about'),
    url(r'^browse/$', 'photos.views.browse'),
    url(r'^browse/(?P<year_id>(19|20)\d\d)/$', 'photos.views.browse'),
    url(r'^browse/(?P<tag_name>\w+)/$', 'photos.views.browse'),
    url(r'^(?P<photo_id>\d+)/$', 'photos.views.photo'),
    url(r'^(?P<photo_id>\d+)/comments$', 'photos.views.photo_with_comments'),
    # url(r'^photoblog/', include('photoblog.foo.urls')),
    
    url(r'^comments/', include('django.contrib.comments.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {
                'document_root': settings.MEDIA_ROOT,
            }),
    
)