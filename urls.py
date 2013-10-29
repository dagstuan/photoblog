from django.conf.urls import patterns, include, url
import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

from photos.feeds import PostsFeed

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'photos.views.post'),
    url(r'^(?P<post_id>\d+)/$', 'photos.views.post'),
    url(r'^(?P<post_id>\d+)/comments/$', 'photos.views.post_with_comments'),
    url(r'^get_comments/(?P<post_id>\d+)/$', 'photos.views.get_comments'),
    url(r'^about/$', 'photos.views.about'),
    url(r'^map/$', 'photos.views.map'),
    url(r'^get_images_for_map/$', 'photos.views.get_images_for_map'),
    url(r'^browse/$', 'photos.views.browse'),
    url(r'^browse/(?P<year_id>(19|20)\d\d)/$', 'photos.views.browse'),
    url(r'^browse/(?P<tag_name>[\w\s-]+)/$', 'photos.views.browse'),
    url(r'^update_browse_grid/(?P<year_id>(19|20)\d\d)/$', 'photos.views.update_browse_grid'),
    url(r'^update_browse_grid/(?P<tag_name>[\w\s-]+)/$', 'photos.views.update_browse_grid'),
    
    url(r'^comments/', include('django.contrib.comments.urls')),
    
    url(r'^rss/$', PostsFeed()),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {
                'document_root': settings.MEDIA_ROOT,
            }),
    
)