var api_key = '786f2efb7e2546e2b3ab5ad399271d6c';
var map;

function createMarkerForImage(map, image_link, image_coords, image_url, image_title) {
    var popup = L.popup()
                 .setLatLng(image_coords)
                 .setContent('<div class="map_thumb"><a href="' + image_link + '"><img src="' + image_url + '" alt="' + image_title + '"></a></div>')
    
    var marker = L.marker(image_coords, {icon: L.AwesomeMarkers.icon({icon: 'camera', markerColor: 'cadetblue', prefix: 'fa'}) })
                  .bindPopup(popup);
    
    return marker;
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
        showCoverageOnHover: false
    });
    
    for (var i = 0; i < images.length; i++) {
        var image = images[i];
        
        var marker = createMarkerForImage(map, image.absolute_url, [image.latitude, image.longitude], image.image_url, image.title);
        
        markers.addLayer(marker);
    }
    
    map.addLayer(markers);
    map.fitBounds(markers);
}

$.when($.ajax('/get_images_for_map'), $(window).load()).then(function(images) {
    initmap(images[0]);
});