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

def _get_published_posts():
    return Post.objects.filter(pub_date__lte=datetime.date.today()).order_by('-pub_date', '-id')

def _get_post(post_id=None):
    if post_id:
        return get_object_or_404(Post, id=post_id)
    else:
        return _get_published_posts()[0]

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
        footer = render_to_string('photos/photo_footer.html')
        
        ret_json = {
                    'title': post.title,
                    'html': html,
                    'footer': footer
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
        next_id = Post.objects.filter(pub_date__gte=post.pub_date, pub_date__lte=datetime.date.today()) \
                              .exclude(id=post.id) \
                              .exclude(id__lte=post.id, pub_date=post.pub_date) \
                              .order_by('pub_date', 'id')[0] \
                              .id
    except:
        pass
    
    return prev_id, next_id
    
def map(request):
    if request.is_ajax():
        html = render_to_string('photos/map_content.html')
        footer = render_to_string('default_footer.html')

        ret_json = {
                    'title': 'Map',
                    'html': html,
                    'footer': footer
                   }

        response = HttpResponse(simplejson.dumps(ret_json), content_type = 'application/json; charset=utf8')
        response['Cache-Control'] = 'no-cache'

        return response
    else:
        return render_to_response('photos/map.html')

def get_images_for_map(request):
    if request.is_ajax() == False:
        raise Http404
    
    posts = _get_published_posts().exclude(photo__exif_latitude = -1, photo__exif_longitude = -1)
                        
    ret_json = []
    
    for post in posts:
        ret_json.append({
            'title': post.title,
            'absolute_url': post.get_absolute_url(),
            'image_url': post.photo.image_thumb1x.url,
            'latitude': post.photo.exif_latitude,
            'longitude': post.photo.exif_longitude
        })
    
    response = HttpResponse(simplejson.dumps(ret_json), content_type = 'application/json; charset=utf8')
    response['Cache-Control'] = 'no-cache'
    
    return response

def _get_posts_for_browse_grid(year_id=None, tag_name=None, posts=None):
    # If posts are supplied our task is purely filtering, so
    # we do not need to fetch the posts.
    if not posts:
        posts = _get_published_posts()
    
    # Getting posts to display. If neither year or tag is supplied,
    # we already have the posts from above
    if year_id:
        posts = posts.filter(pub_date__year=year_id)            
    # Tag has been supplied, get by tag instead
    elif tag_name:
        try:
            tag = Tag.objects.get(name=tag_name)
            posts = [photo.post for photo in TaggedItem.objects.get_by_model(Photo, tag).filter(post__pub_date__lte=datetime.date.today())]
        except:
            return None
    
    return posts

def browse(request, year_id=None, tag_name=None):
    # Getting all published posts.
    posts = _get_posts_for_browse_grid()
    
    # Getting tags first, before filtering the posts further.
    tags = [tag.name for tag in Tag.objects.usage_for_model(Photo, filters=dict(post__pub_date__lte=datetime.date.today()))]
    tags.sort()
    
    # Getting years
    years = [date.year for date in posts.dates('pub_date', 'year', order='DESC')]
    
    # Filtering posts further
    posts = _get_posts_for_browse_grid(year_id, tag_name)
    
    ret_dict = {'posts': posts, 'years': years, 'tags': tags}
    
    if request.is_ajax():
        html = render_to_string('photos/browse_content.html', ret_dict)
        footer = render_to_string('default_footer.html')

        ret_json = {
                    'title': 'Browse',
                    'html': html,
                    'footer': footer
                   }

        response = HttpResponse(simplejson.dumps(ret_json), content_type = 'application/json; charset=utf8')
        response['Cache-Control'] = 'no-cache'

        return response
    else:
        return render_to_response('photos/browse.html', ret_dict)
        
def update_browse_grid(request, year_id=None, tag_name=None):
    posts = _get_posts_for_browse_grid(year_id, tag_name)
    
    template_dict = {'posts': posts}

    response = render_to_response('photos/browse_grid.html', template_dict)
    response['Cache-Control'] = 'no-cache'

    return response

def about(request):
    if request.is_ajax():
        html = render_to_string('photos/about_content.html', None)
        footer = render_to_string('default_footer.html')

        ret_json = {
                    'title': 'About',
                    'html': html,
                    'footer': footer
                   }

        response = HttpResponse(simplejson.dumps(ret_json), content_type = 'application/json; charset=utf8')
        response['Cache-Control'] = 'no-cache'

        return response
    else:        
        return render_to_response('photos/about.html', None)
