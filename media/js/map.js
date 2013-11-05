(function() {
    var api_key = '786f2efb7e2546e2b3ab5ad399271d6c';
    var map;
    
    function Image(link, coords, url, title) {
        this.link = link;
        this.coords = coords;
        this.url = url;
        this.title = title;
    };

    function createMarkerForImage(image) {
        
        var map_thumb = $('<div></div>').addClass('map_thumb');
        
        $('<a></a>').attr('href', image.link)
                    .appendTo(map_thumb);
        
        $('<img></img>').attr('src', image.url)
                        .attr('alt', image.title)
                        .appendTo(map_thumb);

        var popup = L.popup()
                     .setLatLng(image.coords)
                     .setContent(map_thumb.html());

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
    
    function createMarkerForCluster(evt) {
        var layer = evt.layer;
        var images = layer.getAllChildMarkers();
        var currentImage = 0;
        var popupContent = $('<div></div>').addClass('map_thumb');
        
        
        for (var i=0;i<images.length; i++) {
            var image = images[i].image;
            
            var anchor = $('<a></a>').attr('href', image.link)
                                     .attr('class', 'map_thumb_image');
            
            if (i == 0) anchor.addClass('selected');
                        
            anchor.append($('<img />').attr('src', image.url)
                                      .attr('alt', image.title));
                                      
                                  	
            popupContent.append(anchor);
        }
        
        var arrows = $('<div><div>').attr('id', 'arrows');
        
        $('<a></a>').attr('id', 'prevlink')
                    .attr('href', '#')
                    .appendTo(arrows);
        
        $('<a></a>').attr('id', 'nextlink')
                    .attr('href', '#')
                    .appendTo(arrows);
        
        arrows.appendTo(popupContent);
        
        var zoomToBoundsAnchor = $('<a></a>').attr('href', '#')
                                             .attr('class', 'zoomToBoundsAnchor')
        
        $('<i></i>').addClass('fa fa-crosshairs')
                    .appendTo(zoomToBoundsAnchor);
        
        
        popupContent.append(zoomToBoundsAnchor);
        
        popup = L.popup()
                 .setContent(popupContent.html());

        layer.options.icon.bindPopup(popup, { offset: [0, -26] });
        
        layer.options.icon.openPopup();
        
        $('.zoomToBoundsAnchor').on('click', createZoomToBoundsClickFunction(layer.options.icon, layer));
        
        var swapImages = function() {
            $('.map_thumb_image.selected').fadeOut(100, function() {
                $(this).removeClass('selected');
                
                $('.map_thumb_image:eq(' + currentImage + ')').css('display', 'none')
                                                              .addClass('selected')
                                                              .fadeIn(100);
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
        
        $('#prevlink').on('click', arrowClickFunc(false));
        
        $('#nextlink').on('click', arrowClickFunc(true));
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
        
        markers.on('clusterclick', function (a) {
            createMarkerForCluster(a);
        });
    
        for (var i = 0; i < images.length; i++) {
            var img_info = images[i];
            
            var image = new Image(img_info.absolute_url, [img_info.latitude, img_info.longitude], img_info.image_url, img_info.title);
        
            var marker = createMarkerForImage(image);
        
            markers.addLayer(marker);
        }
    
        map.addLayer(markers);
        map.fitBounds(markers);
        map.keyboard.disable();
        
        map.on('popupopen', function(e) {
            $('.leaflet-popup img').retina();
        });
    }

    $.when($.ajax('/get_images_for_map'), $(window).load()).then(function(images) {
        initmap(images[0]);
    });
})();
