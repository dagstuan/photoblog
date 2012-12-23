from django.contrib.syndication.views import Feed
from photos.models import Post
import pdb

class PostsFeed(Feed):
    title = 'Dagstuan.com RSS'
    link = 'http://localhost:8000/rss/'
    description = 'The five latest photos uploaded to dagstuan.com'
    
    def items(self):
        return Post.objects.order_by('-pub_date', 'id')[:5]
    
    def item_title(self, item):
            return item.title

    def item_description(self, item):
        return item.comment