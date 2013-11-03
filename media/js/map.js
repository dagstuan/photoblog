(function() {
    var api_key = '786f2efb7e2546e2b3ab5ad399271d6c';
    var map;
    
    function Image(link, coords, url, title) {
        this.link = link;
        this.coords = coords;
        this.url = url;
        this.title = title;
    };

    function createMarkerForImage(map, image) {
        var popup = L.popup()
                     .setLatLng(image.coords)
                     .setContent('<div class="map_thumb"><a href="' + image.link + '"><img src="' + image.url + '" alt="' + image.title + '"></a></div>');
        
        var marker = L.marker(image.coords, {icon: L.AwesomeMarkers.icon({icon: 'camera', markerColor: 'cadetblue', prefix: 'fa'}) })
                      .bindPopup(popup);
        
        marker.image = image;
    
        return marker;
    }
    
    function createMarkerForCluster(evt) {
        eventet = evt;
        target = evt.target;
        layer = evt.layer;
        
        image = layer.getAllChildMarkers()[0].image;
        
        popup = L.popup()
                 .setLatLng(layer.getLatLng())
                 .setContent('<div class="map_thumb"><a href="' + image.link + '"><img src="' + image.url + '" alt="' + image.title + '"></a></div>');
                 
        layer.options.icon.bindPopup(popup);
        
        layer.options.icon.openPopup();
    }

    function initmap(images) {
        var map = L.map('map', {
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
            createMarkerForCluster(map, a);
        });
    
        for (var i = 0; i < images.length; i++) {
            var img_info = images[i];
            
            var image = new Image(img_info.absolute_url, [img_info.latitude, img_info.longitude], img_info.image_url, img_info.title);
        
            var marker = createMarkerForImage(map, image);
        
            markers.addLayer(marker);
        }
    
        map.addLayer(markers);
        map.fitBounds(markers);
    }

    $.when($.ajax('/get_images_for_map'), $(window).load()).then(function(images) {
        initmap(images[0]);
    });
})();
