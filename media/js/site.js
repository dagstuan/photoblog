$(document).ready(function() {
    $('#current_photo').retina();
    
    $('#browse_grid img').bind('load', fadeInPhoto);
});

// Key bindings
$(document).keydown(function(e) {
    if(e.keyCode == 37 || e.keyCode == 74) {
        $('#prevlink').trigger('click');
    }
    else if (e.keyCode == 39 || e.keyCode == 75) {
        $('#nextlink').trigger('click');
    };
});

var ready = true;

var opts = {
  lines: 13, // The number of lines to draw
  length: 7, // The length of each line
  width: 4, // The line thickness
  radius: 10, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  color: '#FFF', // #rgb or #rrggbb
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: 'auto', // Top position relative to parent in px
  left: 'auto' // Left position relative to parent in px
};

var displayLoading = function() {
    var background = $('<div></div>').attr('class', 'loadingMessage')
                    .css('width', $('#current_photo').width())
                    .css('height', $('#current_photo').height())
                    .css('position', 'absolute')
                    .css('top', '0')
                    .css('left', '0')
                    .css('background', '#2B2B2B')
                    .css('border', '1px solid #353535')
                    .css('padding', '5px')
                    .css('margin-left', '-5px')
                    .css('opacity', '0.7')
                    .css('display', 'none')
                    .appendTo('#content');
    
    var target = document.getElementById('content');
    var spinner = new Spinner(opts).spin(target);
    $('.spinner').css('display', 'none');
    
    background.fadeIn();
    $('.spinner').fadeIn();
}

var hideLoading = function() {
    loadingMsg = $('.loadingMessage');
    spinner = $('.spinner');
    
    spinner.animate({ opacity: 0 }, { duration: 200, queue: false, complete: function() {
        spinner.remove();
    }});
    loadingMsg.animate({ opacity: 0 }, { duration: 200, queue: false, complete: function() {
        loadingMsg.remove();
    }});
}

var replacePhoto = function(newContent, callback) {    
    document.title = newContent['title'] + ' | Dag Stuan';
    
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
                             .css('height', newContent['exif']['height']);
    
    comments.fadeOut(200, function() {
        comments.remove();
    });
    
    newImg.bind('load', function() {
        hideLoading();
        oldPhoto.fadeOut(200, function() {
            oldPhoto.remove();
            
            newPhoto.fadeIn(200, function() {
                ready = true;
            });
        });
    });
}

var fixNavigationLinks = function(arrows, newContent) {
    arrows.empty();

    if(typeof newContent['prev_id'] != 'undefined') {
        arrows.append($('<a></a>').attr('id', 'prevlink')
                                  .attr('href', '/'+newContent['prev_id'])
               );
    };
    
    if(typeof newContent['next_id'] != 'undefined') {
        arrows.append($('<a></a>').attr('id', 'nextlink')
                          .attr('href', '/'+newContent['next_id'])
               );
    };
}

var fadeInPhoto = function(evt) {
    console.log("called");
    
    $(evt.currentTarget).fadeIn();
}

$(document).on('click', '#show_comments_link', function(evt) {
    window.location.href = $(this).attr('href');
    window.location.hash = '#comments';
    window.location.reload();
})

$(document).on('click', '#prevlink', function(evt) {
	evt.preventDefault();
	if(!ready) {
	    return false;
	};
	
	displayLoading();
	
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
	};
	
	displayLoading();
	
	ready = false;
	url = $('#nextlink').attr('href');
	
    $.get(url, function(res) {
		replacePhoto(res);
	});
});