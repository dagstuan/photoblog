(function() {
    jQuery.fn.redraw = function() {
        return this.hide(0, function() {
            $(this).show();
        });
    };
    
    // Makes sure the user cant spam the navigation buttons without animations finishing.
    var ready = false;
    var History = window.History;
    var only_grid = false;

    // Options for spinner
    var opts = {
      lines: 13, // The number of lines to draw
      length: 7, // The length of each line
      width: 3, // The line thickness
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
    
    $(document).ready(function() {
        History.Adapter.bind(window,'statechange',historyUpdated);
    
        $.ajaxSetup({cache: false});
        
        current_photo = $('#current_photo');
        
        if (current_photo.length > 0) {     
            //Hiding elements from view
            $('#bottom').css('visibility', 'hidden');
            $('#arrows').css('display', 'none');
            $('#footer').css('display', 'none');
            $('.image_content').css('display', 'none');
            
            current_photo.retina();
        }
        else if($('#browse_grid').length > 0) {
            setupGridLoading();
        }
        else if($('#about').length > 0) {
            $('#about img').css('display', 'none')
                           .one('load', fadeInPhoto)
                           .each(function() {
                               if(this.complete || (jQuery.browser.msie && parseInt(jQuery.browser.version) == 6))  $(this).trigger("load");
                           });
        }
    })
    
    $(window).on('resize', function (){ 
        // To force chrome to resize the width of the image.
        $('#current_photo').redraw();
    });
    
    $(window).load(function() {
        current_photo = $('#current_photo');
        
        if (current_photo.length > 0) {
            var imageContent = $('.image_content');
            
            imageContent.css('display', '');
                        
            var imgContentHeight = imageContent.height();
            var imgContentWidth = imageContent.width();
            
            current_photo.css('display', 'none');
            
            imageContent.css('width', imgContentWidth)
                        .css('height', imgContentHeight);

            var background = generateLoadingBackground(imageContent);
             
            opts['top'] = imgContentHeight / 2 - 40;
            
            displayLoading(false, imageContent, background);
                
            opts['top'] = 'auto';
                    
            current_photo.one('load', function() {
                hideLoading();
                $('#bottom').css('display', 'none')
                            .css('visibility', '')
                            .fadeIn();
                            
                $('#arrows').fadeIn();
                $('#footer').fadeIn();
                imageContent.css('width', '')
                            .css('height', '');
                current_photo.fadeIn(function() {
                    ready = true;
                });
            })
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
            $('#prevclusterlink').trigger('click');
        }
        else if ((e.keyCode == 39 || e.keyCode == 75) && tag != 'input' && tag != 'textarea') {
            $('#nextlink').trigger('click');
            $('#nextclusterlink').trigger('click');
        }
    });

    var historyUpdated = function() {
        var State = History.getState(); // Note: We are using History.getState() instead of event.state

        var url = State.data['url'];
        var func = State.data['call_func'];
    
        if (url !== undefined) {                
            _gaq.push(['_trackPageview', url]);
        }
        else {
            _gaq.push(['_trackPageview', '/']);
        }
    
        getNewContent(func, url);
    }

    var generateLoadingBackground = function(loadingElement) {
        var background = $('<div></div>').attr('class', 'loadingMessage');
        
        var inner = $('<div></div>').attr('class', 'innerLoading')
                                    .css('width', loadingElement.width())
                                    .css('height', loadingElement.height())
                                    .css('padding', loadingElement.css('padding'))
                                    .appendTo(background);
    
        return background;
    }

    var displayLoading = function(fade, element, background) {
        if (background) {
            background.appendTo(element);
        }
                
        var spinner = new Spinner(opts).spin(element[0]);

        $('.spinner').css('display', 'none');
            
        if (fade) {
            if (background) {
                background.fadeIn();
            }
            $('.spinner').fadeIn();
        }
        else {
            if (background) {
                background.show();
            }
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
        if (func == 'photo') {
            replacePhoto(url);
        }
        else if (func == 'load_photo') {
            loadPhoto(url);
        }
        else if (func == 'gridupdate' && only_grid == true) {
            updateGrid(url);
            only_grid = false;
        }
        else {
            loadNewContent(url);
        }
    }

    var fadeOutContentAndDisplaySpinner = function(content) {
        var spinner_options = {
            'top': '230px',
            'left': 'auto',
            'width': 2,
            'radius': 13,
            'speed': 1.6,
            'color': '#FFF',
            'lines': 15,
            'length': 10,
        };
    
        var spinner = new Spinner(spinner_options).spin(content[0]);
        $('.spinner').css('margin-top', '0')
                     .css('display', 'none');
    
        $('.spinner').fadeIn(200);
        $('#content').add($('#bottom'))
                     .add($('#post_comments'))
                     .add($('#footer'))
                     .fadeOut(200, function() {
                         $(this).css('visibility', 'hidden')
                                .css('display', '');
                     });
    }

    var loadNewContent = function(url) {
        var content = $('#content_wrap');
    
        fadeOutContentAndDisplaySpinner(content);
    
        var scrolledView = scrollViewTo($('body'), 500);
        
        var result;
        var resultHtml;
        
        var contentLoaded = $.get(url).done(function(contentLoadedResult) {
            result = contentLoadedResult;
            resultHtml = $(contentLoadedResult['html'])
            
            resultHtml.filter('#content').find('img').retina();
        });
    
        $.when(contentLoaded, scrolledView).then(function() {
            content.fadeOut(200, function() {
                document.title = result['title'] + ' | Dag Stuan';
                content.html(resultHtml);

                // TODO: make this prettier..
                if (url == '/browse') {
                    setupGridLoading();
                }
            
                if(result['footer'] != null) {
                    $('#footer').html(result['footer']);
                }
            
                $('#footer').css('visibility', 'visible')
                            .css('display', 'none')
                            .fadeIn(200);
            
                content.fadeIn(200, function() {
                    ready = true;
                });
            });
        });
    }

    var loadPhotoContent = function(content_wrap, url) {
        var complete = 0;
        var result_title = null;
        var result_html = null;
        var result_footer = null;

        var scrolledView = scrollViewTo($('body'), 500);
    
        var photoLoaded = $.get(url).done(function(res) {
            result_html = $(res['html']);
            result_title = res['title'];
            result_footer = res['footer'];
                        
            result_html.filter('#content').find('img').retina();
        });
    
        $.when(scrolledView, photoLoaded).then(function() {
            document.title = result_title + ' | Dag Stuan';
        
            result_html.filter('#content').find('img').one('load', function() {
                hideLoading();
            
                var footer = $('#footer');
            
                // If the footer isnt being currently animated, it means that no other
                // methods are hiding it. So we'll need to do it ourselves.
                // TODO: this is kind of hacky..
                if (!footer.is(':animated')) {
                    footer.fadeOut(200)
                }
            
                content_wrap.fadeOut(200, function() {
                                content_wrap.html(result_html);
                
                                if(result_footer != null) footer.html(result_footer);
                
                                footer.css('visibility', 'visible')
                                      .css('display', 'none')
                                      .fadeIn(100);
                              
                                content_wrap.fadeIn(200, function() {
                                    ready = true;
                                });
                });
            })
            .each(function() {
                 if(this.complete || (jQuery.browser.msie && parseInt(jQuery.browser.version) == 6))  $(this).trigger("load");
             });
        });
    }

    // Called when coming from some other site (browse etc.) to viewing a photo
    // First fading out content, then loading and setting up the new photo
    var loadPhoto = function(url) {
        var content_wrap = $('#content_wrap');
    
        fadeOutContentAndDisplaySpinner(content_wrap);
    
        loadPhotoContent(content_wrap, url);
    }

    // Called when a photo is to be replaced, going from a photo to another photo
    var replacePhoto = function(url) {
        var content_wrap = $('#content_wrap');
        var imageContent = $('.image_content');
        
        var background = generateLoadingBackground(imageContent);
        
        opts['top'] = imageContent.height() / 2 - 40;
        
        displayLoading(true, imageContent, background);
            
        opts['top'] = 'auto';
        
        loadPhotoContent(content_wrap, url);
    }

    var updateGrid = function(url) {
        var browse_grid = $('#browse_grid');
        var browse_grid_wrapper = $('#browse_grid_wrapper')
        
        browse_grid_wrapper.css('width', browse_grid.width())
                           .css('height', browse_grid.height());
    
        var browseGridIsFadedOut = browse_grid.fadeOut(200).promise();
        
        opts['top'] = ($(window).height() - $('#top').height()) / 2;
        opts['left'] = ($(window).width() - $('#browse_menu').width()) / 2 - 20;
            
        displayLoading(true, $('body'));
        
        opts['top'] = 'auto';
        opts['left'] = 'auto';
        
        var id = url.split('/')[2];
            
        var viewIsScrolled = scrollViewTo($('body'), 500);
            
        var fetchedBrowseGrid = $.get('/update_browse_grid/' + id + '/');
            
        $.when(fetchedBrowseGrid, browseGridIsFadedOut, viewIsScrolled).then(function(browseGridResult) {
            browse_grid_wrapper.css('width', '')
                               .css('height', '');
                               
            hideLoading();
                        
            browse_grid.html(browseGridResult[0]);
        
            setupGridLoading();
        
            browse_grid.fadeIn(200);
        });
    }

    var setupGridLoading = function() {
        $('#browse_grid img').retina();
        
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

    var showComments = function() {
        var post_comments = $('#post_comments');

        var id = $('#show_comments_link').attr('href').split('/')[1];

        post_comments.css('display', 'none')
                     .load('/get_comments/' + id + '/', function() {
                         post_comments.fadeIn();
             
                         scrollViewTo(post_comments, 1000);
                     });
    }

    var scrollViewTo = function(element, duration) {
        var deferred = $.Deferred();
    
        if ($(window).scrollTop() == element.offset().top) {
            deferred.resolve();
            return deferred.promise();
        }
    
        return $('html, body').animate({scrollTop: element.offset().top, easing: 'swing'}, duration).promise();
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
    });

    $(document).on('click', '#prevlink, #nextlink', function(evt) {
    	evt.preventDefault();
    	if(!ready) {
    	    return false;
    	}

    	ready = false;
    	url = $(this).attr('href');

    	History.pushState({url:url, call_func:'photo'}, null, url)
    });

    $(document).on('click', '#top a', function(evt) {
        evt.preventDefault();
        var url = $(this).attr('href');
    
        History.pushState({url: url}, null, url + '/');
    });

    $(document).on('click', '#browse_grid a, #map a.map_thumb_image', function(evt) {
        evt.preventDefault();
    
        url = $(this).attr('href');

    	History.pushState({url: url, call_func:'load_photo'}, null, url)
    });

    $(document).on('click', '#browse_menu a', function(evt) {
        evt.preventDefault();
    
        url = $(this).attr('href');
    
        only_grid = true;
        History.pushState({url:url, call_func:'gridupdate'}, null, url)
    });

    $(document).on('click', '#show_comments_link', function(evt) {
       evt.preventDefault();
   
       if ($('#post_comments').children().length > 0) {
           return;
       }
   
       showComments();
    });
})();