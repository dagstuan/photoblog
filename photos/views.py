# Create your views here.
from django.http import HttpResponse, HttpRequest, Http404
from django.template import RequestContext
from django.template import Context, loader
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from photos.models import Post, Photo
from tagging.models import TaggedItem, Tag
from django.utils import simplejson
from django.utils import dateformat
from django.contrib.comments.models import Comment
import datetime

import pdb

def index(request):
    posts = Post.objects.filter(pub_date__lte=datetime.date.today()).order_by('-pub_date', '-id')[0:2]
        
    c = Context({
        'post': posts[0],
    })
    
    if len(posts) > 1:
        c['prev_id'] = posts[1].id
    
    return render_to_response('photos/show_photo.html', c)
    
def photo(request, photo_id, comments=False):
    post = get_object_or_404(Post, id=photo_id)

    prev_id = None
    next_id = None
    
    try:
        prev_id = Post.objects.filter(pub_date__lte=post.pub_date) \
                              .exclude(id=post.id) \
                              .exclude(id__gte=post.id, pub_date=post.pub_date) \
                              .order_by('-pub_date', '-id')[0] \
                              .id
    except:
        pass
        
    try:
        next_id = Post.objects.filter(pub_date__gte=post.pub_date) \
                              .filter(pub_date__lte=datetime.date.today()) \
                              .exclude(id=post.id) \
                              .exclude(id__lte=post.id, pub_date=post.pub_date) \
                              .order_by('pub_date', 'id')[0] \
                              .id
    except:
        pass
	
    retDict = {}	
    
    if not prev_id is None:
        retDict['prev_id'] = prev_id
    if not next_id is None:
        retDict['next_id'] = next_id
        
    if comments:
        retDict['post_comments'] = True
    else:
        retDict['post_comments'] = False
    
    if request.is_ajax():
        retDict['post_id'] = post.id
        retDict['title'] = post.title
        retDict['comment'] = post.comment
        retDict['photo_url'] = post.photo.image_file.url
        retDict['permalink'] = post.get_absolute_url()
        retDict['pub_date'] = dateformat.format(post.pub_date, "jS") + " of " + dateformat.format(post.pub_date, "F Y")
        
        retDict['comment_count'] = Comment.objects.filter(object_pk=post.id).count()
        
        retDict['exif'] = {
            'shutter_speed': post.photo.exif_shutter_speed,
            'aperture': post.photo.exif_aperture,
            'focal_length': post.photo.exif_focal_length,
            'iso': post.photo.exif_iso,
        }
        
        return HttpResponse(simplejson.dumps(retDict), content_type = 'application/json; charset=utf8')
        
    else:
        retDict['post'] = post
        
        csrfContext = RequestContext(request, retDict)
        
        return render_to_response('photos/show_photo.html', csrfContext)
    
def photo_with_comments(request, photo_id):
    return photo(request, photo_id, comments=True)

def browse(request, year_id=None, tag_name=None):
    if not tag_name:
        if not year_id:
            posts = Post.objects.all()
        else:
            posts = get_list_or_404(Post, pub_date__year=year_id)
    # Tag has been supplied, get by tag instead
    else:
        tag = Tag.objects.get(name=tag_name)
        posts = [photo.post for photo in TaggedItem.objects.get_by_model(Photo, tag)]
    
    years = [date.year for date in Post.objects.filter(pub_date__lte=datetime.date.today()).dates('pub_date', 'year', order='DESC')]
    tags = [tag.name for tag in Tag.objects.all().order_by('name')]
    
    return render_to_response('photos/browse.html', {'posts': posts, 'years': years, 'tags': tags})

def about(request):
    return render_to_response('photos/about.html', None)