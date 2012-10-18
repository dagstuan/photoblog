// Makes sure the user cant spam the navigation buttons without animations finishing.
var ready = false;
var History = window.History;

// Options for spinner
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
}

$(document).ready(function() {
    History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
        var State = History.getState(); // Note: We are using History.getState() instead of event.state
        
        if (State.data.url !== undefined) {                
            _gaq.push(['_trackPageview', State.data.url]);
        }
        else {
            _gaq.push(['_trackPageview', '/']);
        }
        
        $.ajaxSetup({cache: false});
        
        var func = State.data['call_func'];
        var url = State.data['url'];

        getNewContent(func, url);
    });
    
    current_photo = $('#current_photo');
    
    if (current_photo.length > 0) {
        current_photo.retina();
        current_photo.css('display', 'none');
        displayLoading(false);
        
        bottom = $('#bottom');
        arrows = $('#arrows');
        
        // Hiding elements from view
        bottom.css('visibility', 'hidden');
        arrows.css('display', 'none');
        
        current_photo.one('load', function() {
            hideLoading();
            bottom.css('display', 'none')
                  .css('visibility', '')
                  .fadeIn();
            arrows.fadeIn();
            current_photo.fadeIn(function() {
                current_photo.css('height', '')
                             .css('width', '');
                
                ready = true;
            });
        })
        .each(function() {
             if(this.complete || (jQuery.browser.msie && parseInt(jQuery.browser.version) == 6))  $(this).trigger("load");
        });
    }
    else if($('#browse_grid').length > 0) {
        $('.browse_thumb').each(function() {
            var spinner = new Spinner(opts).spin(this);
        })
        
        
        $('#browse_grid img').css('display', 'none')
                             .one('load', fadeInPhoto)
                             .each(function() {
                                 if(this.complete || (jQuery.browser.msie && parseInt(jQuery.browser.version) == 6))  $(this).trigger("load");
                             });
    }
    else if($('#about').length > 0) {
        $('#about img').css('display', 'none')
                       .one('load', fadeInPhoto)
                       .each(function() {
                           if(this.complete || (jQuery.browser.msie && parseInt(jQuery.browser.version) == 6))  $(this).trigger("load");
                       });
    }
});

// Key bindings
$(document).keydown(function(e) {
    var tag = e.target.tagName.toLowerCase();
    
    if((e.keyCode == 37 || e.keyCode == 74) && tag != 'input' && tag != 'textarea') {
        $('#prevlink').trigger('click');
    }
    else if ((e.keyCode == 39 || e.keyCode == 75) && tag != 'input' && tag != 'textarea') {
        $('#nextlink').trigger('click');
    }
});

var displayLoading = function(fade) {
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
    
    if (fade) {
        background.fadeIn();
        $('.spinner').fadeIn();
    }
    else {
        background.show();
        $('.spinner').show();
    }
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

var getNewContent = function(func, url) {
    switch(func) {
        case 'photo':
            replacePhoto(url);
            break;
        default:
            loadNewContent(url);
    }
}

var loadNewContent = function(url) {
    scrollViewTo($('body'), 500);
    
    var content = $('#content_wrap');

    $.get(url, function(res) {
        document.title = res['title'] + ' | Dag Stuan';
        
        content.fadeOut(200, function() {
            content.html(res['html']);
            
            content.fadeIn(200);
            
            // TODO: make this prettier..
            if (url == '/browse') {
                
                opts['top'] = '44px';
                opts['left'] = '43px';

                $('.browse_thumb').each(function() {
                    var spinner = new Spinner(opts).spin(this);
                });

                opts['top'] = 'auto';
                opts['left'] = 'auto';

                $('#browse_grid img').css('display', 'none')
                                     .one('load', fadeInPhoto)
                                     .each(function() {
                                         if(this.complete || (jQuery.browser.msie && parseInt(jQuery.browser.version) == 6))  $(this).trigger("load");
                                     });
            }
        });
    })
}

var replacePhoto = function(url) {
    displayLoading(true);
    
    scrollViewTo($('body'), 500);
    
    var content = $('#content_wrap');
    
    $.get(url, function(res) {
        document.title = res['title'] + ' | Dag Stuan';

        hideLoading();
        content.fadeOut(200, function() {
            content.html(res['html']);

            content.fadeIn(200, function() {
                ready = true;
            });
        });
    });
}

var showComments = function() {
    var post_comments = $('#post_comments');

    var id = $('#show_comments_link').attr('href').split('/')[1];

    post_comments.css('display', 'none')
                 .load('/get_comments/' + id + '/', function() {
                     post_comments.fadeIn();
             
                     scrollViewTo(post_comments, 1000);
                 });
}

var scrollViewTo = function(element, duration, callback) {
    $('html, body').animate({
                                scrollTop: element.offset().top,
                                easing: 'swing',
                            }, duration, callback);
}

var fadeInPhoto = function(evt) {
    // TODO: this is kindof stupid, since this function is general.
    var spinner = $(evt.currentTarget).parent().parent().find('.spinner');
    
    spinner.animate({ opacity: 0 }, { duration: 200, queue: false, complete: function() {
        spinner.remove();
    }});
    
    $(evt.currentTarget).fadeIn();
}

$(document).on('submit', '#post_comments form', function(evt) {
    evt.preventDefault();

    form = $('#post_comments form');
    
    $.ajax({
        type: "POST",
        data: form.serialize(),
        url: form.attr('action'),
        cache: false,
        dataType: "html",
        success: function(html, textStatus) {
            // if JSON is returned, posting went well.
            try {
                var response = $.parseJSON(html);
                
                // If no comments added before this
                if ($('#nocomments').length) {
                    $('#nocomments').replaceWith($('<dl></dl>').attr('id', 'comments'));
                    $('#nocommentline').replaceWith($('<div></div>').attr('id', 'comment_line'));
                }
                
                $('ul.errorlist').remove();
                
                var name = $('#id_name').val();
                var comment = $('#id_comment').val();
                
                $('#id_name').val('');
                $('#id_comment').val('');
                $('#id_email').val('');
                
                var numComments = /\d+(?:\.\d+)?/.exec($('#show_comments_link').text());
                
                $('#show_comments_link').text(response['comment_count'] + ' ' + ((response['comment_count'] == 1) ? 'comment' : 'comments'));
                
                comments = $('#comments');
                
                var title_elem = $('<dt></dt>').css('display', 'none')
                              .append($('<h3></h3>').text(name))
                              .append(response['pub_date'])
                              .appendTo(comments)
                              .fadeIn();
                
                var comment_elem = $('<dd></dd>').css('display', 'none')
                              .append($('<p></p>').text(comment))
                              .appendTo(comments)
                              .fadeIn();   
            }
            catch(e) {
                form.replaceWith(html);
            }
        },
        error: function() {
            // TODO: fix this to something more sensible.
            console.log("Error sending the comment!");
        },
    });
})

$(document).on('click', '#prevlink', function(evt) {
	evt.preventDefault();
	if(!ready) {
	    return false;
	}

	ready = false;
	url = $('#prevlink').attr('href');
	
	History.pushState({url:url, call_func:'photo'}, null, url + '/')
});

$(document).on('click', '#nextlink', function(evt) {
	evt.preventDefault();
	if(!ready) {
	    return false;
	}
	
	ready = false;
	url = $('#nextlink').attr('href');
	
	History.pushState({url:url, call_func:'photo'}, null, url + '/');
});

$(document).on('click', '#show_comments_link', function(evt) {
   evt.preventDefault();
   
   if ($('#post_comments').children().length > 0) {
       return;
   }
   
   showComments();
   
   //History.pushState({url:url, call_func:'comments', only_comments:true}, null, url + '/');
});

$(document).on('click', '#top a', function(evt) {
    evt.preventDefault();
    var url = $(this).attr('href');
    
    hist_dict = {url:url};
    
    if (url === '/') {
        hist_dict['call_func'] = 'photo';
    }
    
    History.pushState(hist_dict, null, url + '/');
});