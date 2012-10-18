# Create your views here.
from django.http import HttpResponse, HttpRequest, Http404
from django.template import RequestContext
from django.template import Context, loader
from django.shortcuts import render_to_response, get_object_or_404, get_list_or_404
from django.template.loader import render_to_string
from photos.models import Post, Photo
from tagging.models import TaggedItem, Tag
from django.utils import simplejson
from django.utils import dateformat
from django.contrib.comments.models import Comment
import datetime

def post(request, post_id=None, comments=False):
    post = _get_post(post_id)
	
    ret_dict = {'post': post}	
    
    prev_id, next_id = _get_prev_and_next_post(post)
    
    if not prev_id is None:
        ret_dict['prev_id'] = prev_id
    if not next_id is None:
        ret_dict['next_id'] = next_id
        
    if comments:
        ret_dict['post_comments'] = True
    else:
        ret_dict['post_comments'] = False
    
    csrfContext = RequestContext(request, ret_dict)
    
    if request.is_ajax():
        html = render_to_string('photos/photo.html', csrfContext)
        
        ret_json = {
                    'title': post.title,
                    'html': html
                   }
                   
        if comments:
            ret_json['comment_count'] = Comment.objects.filter(object_pk=post.id).count()
        
        response = HttpResponse(simplejson.dumps(ret_json), content_type = 'application/json; charset=utf8')
        response['Cache-Control'] = 'no-cache'
        
        return response
    else:
        return render_to_response('photos/show_photo.html', csrfContext)

def post_with_comments(request, post_id):
    return post(request, post_id, comments=True)

        
def get_comments(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    csrfContext = RequestContext(request, { 'post': post })

    return render_to_response('photos/comments.html', csrfContext)

def _get_post(post_id=None):
    if post_id:
        return get_object_or_404(Post, id=post_id)
    else:
        return Post.objects.filter(pub_date__lte=datetime.date.today()).order_by('-pub_date', '-id')[0]

def _get_prev_and_next_post(post):
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
    
    return prev_id, next_id

def browse(request, year_id=None, tag_name=None):
    # Getting all published posts.
    posts = Post.objects.filter(pub_date__lte=datetime.date.today()).order_by('-pub_date', '-id')
    
    # Getting tags first, before filtering the posts further.
    tags = [tag.name for tag in Tag.objects.usage_for_model(Photo, filters=dict(post__pub_date__lte=datetime.date.today()))]
    tags.sort()
    
    # Getting years
    years = [date.year for date in posts.dates('pub_date', 'year', order='DESC')]
    
    # Getting posts to display. If neither year or tag is supplied,
    # we already have the posts from above
    if year_id:
        posts = posts.filter(pub_date__year=year_id)            
    # Tag has been supplied, get by tag instead
    elif tag_name:
        tag = Tag.objects.get(name=tag_name)
        posts = [photo.post for photo in TaggedItem.objects.get_by_model(Photo, tag).filter(post__pub_date__lte=datetime.date.today())]
    
    ret_dict = {'posts': posts, 'years': years, 'tags': tags}
    
    if request.is_ajax():
        html = render_to_string('photos/browse_content.html', ret_dict)

        ret_json = {
                    'title': 'Browse | Dag Stuan',
                    'html': html
                   }

        response = HttpResponse(simplejson.dumps(ret_json), content_type = 'application/json; charset=utf8')
        response['Cache-Control'] = 'no-cache'

        return response
    else:
        return render_to_response('photos/browse.html', ret_dict)

def about(request):
    if request.is_ajax():
        html = render_to_string('photos/about_content.html', None)

        ret_json = {
                    'title': 'About | Dag Stuan',
                    'html': html
                   }

        response = HttpResponse(simplejson.dumps(ret_json), content_type = 'application/json; charset=utf8')
        response['Cache-Control'] = 'no-cache'

        return response
    else:        
        return render_to_response('photos/about.html', None)
