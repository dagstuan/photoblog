$(document).ready(function() {
    $('#current_photo').retina();
});

// Key bindings
$(document).keydown(function(e) {
    console.log(e.keyCode)
    if(e.keyCode == 37 || e.keyCode == 74) {
        $('#prevlink').trigger('click')
    }
    else if (e.keyCode == 39 || e.keyCode == 75) {
        $('#nextlink').trigger('click')
    }
});

var ready = true;

var replacePhoto = function(newContent, callback) {    
    document.title = newContent['title'] + ' | Dag Stuan'
    
    var oldPhoto = $('#current_photo_wrap');
    var newPhoto = $('#current_photo_wrap').clone().appendTo('#content_wrap');

    newPhoto.css('display', 'none')
            .css('width', '100%')
            .css('top', '0')
            .css('left', '0');
    
    newImg = newPhoto.find('#current_photo')
    
    newImg.attr('src', newContent['photo_url'])
          .attr('alt', newContent['title'])
          .retina();
    
    
    newPhoto.find('#title .head')
            .text(newContent['title']);
    
    newPhoto.find('#title .comment')
            .text(newContent['comment']);
    
    newPhoto.find('#meta')
            .empty()
            .append($('<span></span>').attr('class', 'header').text('Published'))
            .text(newContent['pub_date']);
    
    newPhoto.find('#photo_focal_length')
            .text(newContent['exif']['focal_length']);
    
    newPhoto.find('#photo_shutter_speed')
            .text(newContent['exif']['shutter_speed']);
    
    newPhoto.find('#photo_aperture')
            .text(newContent['exif']['aperture']);
    
    newPhoto.find('#photo_iso')
            .text(newContent['exif']['iso']);
            
    newPhoto.find('#permalink a')
            .attr('href', newContent['permalink']);
    
    newPhoto.find('#comments_count a')
            .attr('href', '/'+newContent['post_id']+'/comments#comments')
            .text(newContent['comment_count'] + ' ' + ((newContent['comment_count'] == 1) ? 'comment' : 'comments'));
    
    var comments = $('#post_comments');
    
    fixNavigationLinks(newPhoto.find('#arrows'), newContent);
    
    newPhoto.find('#content').css('width', newContent['exif']['width'])
    
    comments.fadeOut(200, function() {
        comments.remove();
    });
    
    newImg.bind('load', function() {
        oldPhoto.fadeOut(200, function() {
            oldPhoto.remove();
            newPhoto.fadeIn(200, function() {
                ready = true;
            });
        });
    });
}

var fixNavigationLinks = function(arrows, newContent) {
    arrows.empty()

    if(typeof newContent['prev_id'] != 'undefined') {
        arrows.append($('<a></a>').attr('id', 'prevlink')
                                  .attr('href', '/'+newContent['prev_id'])
               )
    }
    
    if(typeof newContent['next_id'] != 'undefined') {
        arrows.append($('<a></a>').attr('id', 'nextlink')
                          .attr('href', '/'+newContent['next_id'])
               )
    }
}

$(document).on('click', '#show_comments_link', function(evt) {
    window.location.href = $(this).attr('href')
    window.location.hash = '#comments'
    window.location.reload()
})

$(document).on('click', '#prevlink', function(evt) {
	evt.preventDefault();
	if(!ready) {
	    return false;
	}
	
	ready = false;
	url = $('#prevlink').attr('href');
	
	$.get(url, function(res) {
		replacePhoto(res);
	});
});

$(document).on('click', '#nextlink', function(evt) {
	evt.preventDefault();
	if(!ready) {
	    return false;
	}
	
	ready = false;
	url = $('#nextlink').attr('href');
	
	$.get(url, function(res) {
		replacePhoto(res);
	});
	
});