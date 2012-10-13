from photos.models import Photo, Post
from django.http import HttpRequest
from django.contrib import admin

from django.db import reset_queries, close_connection

from django.contrib.admin import BooleanFieldListFilter

class PhotoInline(admin.TabularInline):
    model = Photo

class PostAdmin(admin.ModelAdmin):
    actions=['really_delete_selected']
    
    fieldsets = [
        (None,               {'fields': ['title', 'pub_date', 'comment']}),
    ]
    inlines = [PhotoInline]
    
    list_display = ('title', 'comment', 'admin_thumbnail', 'is_published')
    
    list_filter = ('pub_date',)
    
    def get_actions(self, request):
        actions = super(PostAdmin, self).get_actions(request)
        del actions['delete_selected']
        return actions
            
    def really_delete_selected(self, request, queryset):
        for obj in queryset:
            obj.delete()

        if queryset.count() == 1:
            message_bit = "1 post entry was"
        else:
            message_bit = "%s post entries were" % queryset.count()
        self.message_user(request, "%s successfully deleted." % message_bit)
    
    really_delete_selected.short_description = "Delete selected entries"

admin.site.register(Post, PostAdmin)