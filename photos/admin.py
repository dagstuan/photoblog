from photos.models import Photo, Post
from django.http import HttpRequest
from django.contrib import admin

from django.db import reset_queries, close_connection

import pdb

class PhotoInline(admin.TabularInline):
    model = Photo

class PostAdmin(admin.ModelAdmin):
    fieldsets = [
        (None,               {'fields': ['title', 'pub_date', 'comment']}),
    ]
    inlines = [PhotoInline]

admin.site.register(Post, PostAdmin)