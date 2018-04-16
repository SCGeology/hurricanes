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

var tableData = []
var dt

var oef = function(feature,layer){
    tableData.push({
            "KEY":feature.properties.KEY_,
            "NAME":feature.properties.NAME,
            "YEAR":feature.properties.YEAR,
            "MAXSTAT":feature.properties.MAXSTAT,
            "HURCAT":feature.properties.HURCAT,
            "MAXWIND":feature.properties.MAXWIND,
            "MINPRES":feature.properties.MINPRES            
        });
}

var stormTracks = L.esri.featureLayer({
    url: data,
    onEachFeature:oef,
    style:function(feature){
      var c,w
      switch (feature.properties.HURCAT) {
        case 1:
          c = '#c7e9b4';
          w = 2
          break;
        case 2:
          c = '#7fcdbb';
              w = 3
          break;
        case 3:
          c = '#41b6c4';
              w = 4
          break;
        case 4:
          c = '#2c7fb8';
              w = 5
          break;
        case 5:
          c = '#253494';
              w = 6
          break;      
        default:
          c = '#fff';
              w = 1
      }
      return {color: c, opacity: 0.7, weight: w};
    }
}).addTo(map);

//load data table data from REST service
var query = L.esri.query({
    url:data
});

var makeDataTable = function(){
    dt = $('#results-table').DataTable({
        language:{
            search:"Search for Storms:",
            searchPlaceholder:"Storm name, description",
            info:"Showing _TOTAL_ storms."
        },
        select:'single',
        data: tableData,
        columns:[
            {data: 'NAME'},
            {data: 'YEAR'},
            {data: 'MAXSTAT'},
            {data: 'HURCAT'},
            {data: 'MAXWIND'},
            {data: 'MINPRES'},
        ],
        rowId:'KEY'
    });
};

var initialLoad = 0

//initial data table 
stormTracks.on('load', function(e){
    if (initialLoad ==0){
        makeDataTable()
        initialLoad = 1
    }
});

stormTracks.bindPopup(function(layer){
    return L.Util.template('<p>{NAME}<br>{YEAR}<br>Max Wind: {MAXWIND}<br>Min Pressure: {MINPRES}<br>{MAXSTAT} {HURCAT}',layer.feature.properties);
});

var getCatList = function(){
    var catList = []
    var catNull = ""
    var huWhere = ""
    var operator = ""
    $("#storm-cat-group input:checkbox").each(function(){
        if (!$(this).hasClass('hu') && $(this).is(':checked')){
            catNull = "HURCAT IS NULL"
        } else if ($(this).is(':checked')){
            catList.push($(this).val());
        }
    });
    
    if (catList.length > 0 && catNull.length > 0) {
        operator = "OR"
        huWhere = "HURCAT IN ("+catList.toString()+")"
    } else if (catList.length > 0 && catNull.length == 0){
        huWhere = "HURCAT IN ("+catList.toString()+")"
    }
    
    return [huWhere,operator,catNull].join(' ');
};

var getYearRange = function(){
    return "YEAR >= '"+$('#startyear').val()+"' AND YEAR <='"+$('#endyear').val()+"' AND";
}

var queryTable = function(){
    
}

var updateTable = function(table){
    table.rows.add(tableData).draw();
    console.log(tableData);
}

var runFilters = function(){
        
    var exp = [getYearRange(), getCatList()].join(' ').replace('"','')
    
    //run the where filter for the arcgis online service
    stormTracks.setWhere([getYearRange(), getCatList()].join(' ').replace('"',''));
                         
    dt.clear() 
    
    tableData = []

    var tablequery = L.esri.query({
        url:data
    });
    
    query.where(exp).returnGeometry(false);
    
    query.run(function(error,fc,response){
        for (var i = 0; i < fc.features.length; i++){
            tableData.push({
                "KEY":fc.features[i].properties.KEY_,
                "NAME":fc.features[i].properties.NAME,
                "YEAR":fc.features[i].properties.YEAR,
                "MAXSTAT":fc.features[i].properties.MAXSTAT,
                "HURCAT":fc.features[i].properties.HURCAT,
                "MAXWIND":fc.features[i].properties.MAXWIND,
                "MINPRES":fc.features[i].properties.MINPRES
            });
        }
        updateTable(dt);
    }); 
};

//FILTER BUTTON CLICKS 

$("#toggle-filters").on('click',function(){
    $("#storm-search").slideToggle( "slow" );
});

$("#check-all").on('click', function(){
    $("#storm-cat-group input:checkbox").prop('checked',true);
});
$("#uncheck-all").on('click', function(){
    $("#storm-cat-group input:checkbox").prop('checked',false);
});

$("#apply-filter").on('click', function(){
    trackHighlight.setWhere("KEY_ =''")
    runFilters();
});

$("#reset").on('click', function(){
    $('#startyear').val(1871);
    $('#endyear').val(2017);
});

//TABLE SELECTION INTERACTION WITH MAP
var trackHighlight = L.esri.featureLayer({
    url: data,
    fields:["OBJECTID","KEY_"],
    style: {
        "color":"#00fffa",
        "weight":8,
        "opacity":0.8        
    },
    where:"KEY_=''"
}).addTo(map);

trackHighlight.bindPopup(function(layer){
    return L.Util.template('<p>{NAME}<br>{YEAR}<br>Max Wind: {MAXWIND}<br>Min Pressure: {MINPRES}<br>{MAXSTAT} {HURCAT}',layer.feature.properties);
});

var stormKey

$("#results-table").on( 'click', 'tr', function () {
    stormKey = dt.row( this ).id();
    trackHighlight.setWhere("KEY_ =''")
    $("#storm-details-btn").removeClass("disabled");
    $("#storm-track-btn").removeClass("disabled");
});

$("#storm-track-btn").on('click', function(){
    trackHighlight.setWhere("KEY_ ='"+stormKey+"'")
});

//ADD POINTS FOR INDIVIDUAL STORMS
var pointData = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/sc_tropical_storms_points/FeatureServer/0"
var stormPoints = L.esri.featureLayer({
    url: pointData,
    pointToLayer: function(geojson, latlng){
        return L.circleMarker(latlng, {
            radius:6,
            fillColor:"#2e445b",
            color:"#fff",
            opacity:0.7,
            weight:2,
            fillOpacity:0.5
        });
    },
    where:"KEY_=''"
}).addTo(map);

$("#storm-details-btn").on('click',function(){
    map.removeLayer(stormTracks);
    stormPoints.setWhere("KEY_ = '"+stormKey+"'");
    console.log(stormKey);
});
