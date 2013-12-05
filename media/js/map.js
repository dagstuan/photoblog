(function() {
    var api_key = '786f2efb7e2546e2b3ab5ad399271d6c';
    var img_to_show = window.location.pathname.split('/')[2];
    var map;
    
    function Image(id, link, coords, url, title) {
        this.id = id;
        this.link = link;
        this.coords = coords;
        this.url = url;
        this.title = title;
    };

    function createMarkerForImage(image) {
        var source = $('#popup-template').html();
        var template = Handlebars.compile(source);
        var context = {
            href: image.link,
            url: image.url,
            title: image.title
        }
        
        var html = template(context);

        var popup = L.popup()
                     .setLatLng(image.coords)
                     .setContent(html);

        var marker = L.marker(image.coords, {icon: L.AwesomeMarkers.icon({icon: 'camera', markerColor: 'cadetblue', prefix: 'fa'}) })
                      .bindPopup(popup); 
        
        marker.image = image;
    
        return marker;
    }
    
    function createZoomToBoundsClickFunction(marker, layer) {
        var marker = marker;
        var layer = layer;
        
        return function() {
            marker.closePopup();
            
            map.fitBounds(layer.getBounds().pad(0.3))
        }
    }
    
    function setArrowClickFunction(images) {
        var currentImage = 0;
        
        var swapImages = function() {
            var parent = $('.map_thumb_image').parent();
            parent.css('height', parent.height())
            
            $('.map_thumb_image.selected').fadeOut(150, function() {
                $(this).removeClass('selected');

                $('.map_thumb_image:eq(' + currentImage + ')').addClass('selected')
                                                              .hide()
                                                              .fadeIn(150, function() {
                                                                  parent.css('height', '');
                                                              });
            });
        }
        
        var arrowClickFunc = function(forward) {
            if (forward) {
                return function() {
                    currentImage++;
                    if (currentImage >= images.length){
                        currentImage = 0;
                    }
                    
                    swapImages();
                }
            }
            else {
                return function() {
                    currentImage--;
                    if (currentImage < 0) {
                        currentImage = images.length - 1;
                    }
                    
                    swapImages();
                }
            }
        }
        
        $('#prevclusterlink').on('click', arrowClickFunc(false));
        
        $('#nextclusterlink').on('click', arrowClickFunc(true));
    }
    
    function createMarkerForCluster(evt) {
        var layer = evt.layer;
        var images = layer.getAllChildMarkers();

        var source = $('#cluster-popup-template').html();
        var template = Handlebars.compile(source);
        var context = {
            images: []
        }
        
        for (var i=0; i<images.length; i++) {
            var image = images[i].image;
            
            var imgclass = "map_thumb_image";
            
            context.images.push({
                id: image.id,
                href: image.link,
                url: image.url,
                title: image.title,
                imgclass: imgclass
            });
        }
        
        // Set correct selected image
        if(img_to_show == "") {
            context.images[0].imgclass += " selected";
        }
        else {
            for(var i=0; i<context.images.length; i++) {
                if(context.images[i].id == img_to_show) {
                    context.images[i].imgclass += " selected";
                    break;
                }
            }
        }
                
        var html = template(context);
        
        popup = L.popup()
                 .setContent(html);

        layer.options.icon.bindPopup(popup, { offset: [0, -26],
                                              autoPanPadding: [28, 7] });
        
        layer.options.icon.openPopup();
        
        $('.zoomToBoundsAnchor').on('click', createZoomToBoundsClickFunction(layer.options.icon, layer));
        
        setArrowClickFunction(images);
    }

    function initmap(images) {
        map = L.map('map', {
            closePopupOnClick: false,
        });

        L.tileLayer("http://{s}.tile.cloudmade.com/786f2efb7e2546e2b3ab5ad399271d6c/112216/256/{z}/{x}/{y}.png", {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
            maxZoom: 18
        }).addTo(map);

        var markers = L.markerClusterGroup({
            iconCreateFunction: function(cluster) {
                return new L.AwesomeMarkers.icon({markerColor: 'cadetblue', html: cluster.getChildCount()})
            },
            spiderfyOnMaxZoom: false,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: false,
            maxClusterRadius: 30
        });
        
        markers.on('clusterclick', function (evt) {
            createMarkerForCluster(evt);
        });
        
        var bounds_to_fit = null;
        var marker_to_show = null;
    
        for (var i = 0; i < images.length; i++) {
            var img_info = images[i];
            
            var image = new Image(img_info.id, img_info.absolute_url, [img_info.latitude, img_info.longitude], img_info.image_url, img_info.title);
        
            var marker = createMarkerForImage(image);
                        
            if (img_to_show == image.id) {
                bounds_to_fit = [img_info.latitude, img_info.longitude];
                marker_to_show = marker;
            }
            
            markers.addLayer(marker);
        }
        
        map.addLayer(markers);
        map.keyboard.disable();
        
        if (bounds_to_fit != null) {
            map.setView(bounds_to_fit, 13);
        }
        else {
            map.fitBounds(markers)
        }
        
        map.on('popupopen', function(e) {
            $('.leaflet-popup img').retina();
        });
        
        if (img_to_show != "") {
            var visible = markers.getVisibleParent(marker_to_show);
            
            visible.fireEvent('click');
        }
    }

    $.when($.ajax('/get_images_for_map'), $(window).load()).then(function(images) {
        initmap(images[0]);
    });
})();
