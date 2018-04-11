var map = L.map('map', {
    doubleClickZoom:'center',
    wheelPxPerZoomLevel:100,
    zoom: 4,
    center: [30.7,-70]
});

var Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
}).addTo(map);

var data = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/sc_tropical_storms/FeatureServer/0"

var tableMaker = "<tr id='{KEY_}'><td>{NAME}</td><td>{YEAR}</td><td>{MAXSTAT} {HURCAT}</td><td>{MAXWIND}</td><td>{MINPRES}</td><td></td></tr>"

var stormquery = L.esri.query({
    url:data
});

var stormTracks = L.esri.featureLayer({
    url: data,
    onEachFeature:function(feature,layer){
        $("#results-table tbody").append(L.Util.template(tableMaker,layer.feature.properties));
    }
}).addTo(map);

var makeDataTable = function(){
    $('#results-table').DataTable({
        language:{
            search:"Search for Storms:",
            searchPlaceholder:"storm name, keywords",
            info:"Showing _TOTAL_ storms."
        },
        lengthChange:false,
        paging:false,
        scrollY:"500px",
        scrollCollapse:true,
        dom:'fti',
        select:'single'
    });
    
    $("#results-table tbody tr").on("click", function(){
        if ( !$(this).hasClass("selected") ) {
            console.log($(this).attr('id'));
        }
    });
};

var initialLoad = 0

stormTracks.on('load', function(e){
    if (initialLoad ==0){
        makeDataTable();
        initialLoad = 1
    }
});

stormTracks.bindPopup(function(layer){
    return L.Util.template('<p>{NAME}<br>{YEAR}<br>Max Wind: {MAXWIND}<br>Min Pressure: {MINPRES}<br>{MAXSTAT} {HURCAT}',layer.feature.properties);
});
