/*
TO DO
-----
clear filters button
back to storms button
link to reports
need to get ID from selected line so that the details btn works
make icons for landfalls or records
colors for points need to be better
need to clean up and combine things, make things more efficient
fix TS filter

TO BE DISCUSSED
---------------
download data
other filters

*/
var map = L.map('map', {
    doubleClickZoom:'center',
    wheelPxPerZoomLevel:100
}).fitBounds([[21, -90],[52,-13]]);

var Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
}).addTo(map);

var data = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/sc_tropical_storms/FeatureServer/0"

var tableData = []
var rt

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

var c1 = "#feb24c",
    c2 = "#fd8d3c",
    c3 = "#fc4e2a",
    c4 = "#e31a1c",
    c5 = "#b10026",
    ct = "#41b6c4"

var trackStyle = function(feature){
      var c,w, d = false
      switch (feature.properties.HURCAT) {
        case 1:
          c = c1;
          w = 3
          break;
        case 2:
          c = c2;
              w = 4
          break;
        case 3:
          c = c3;
              w = 4
          break;
        case 4:
          c = c4;
              w = 5
          break;
        case 5:
          c = c5;
              w = 5
          break;      
        default:
          c = ct;
              w = 3;
              d = "10 5"
      }
      return {color: c, opacity: 0.8, weight: w, dashArray:d};
    }

var stormTracks = L.esri.featureLayer({
    url: data,
    onEachFeature:oef,
    style:trackStyle
}).addTo(map);

//load data table data from REST service
var query = L.esri.query({
    url:data
});

var makeResultTable = function(){
    rt = $('#results-table').DataTable({
        language:{
            search:"Search",
            searchPlaceholder:"Storm name, description",
            info:"_TOTAL_ storms",
            infoFiltered: " of _MAX_ total",
            infoEmpty: "_TOTAL_ storms"
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
        rowId:'KEY',
        responsive:true,
        pageLength:25,
        dom: "<'#t-search.row'<'col-sm-8'f><'col-sm-4'i>>t<'row'<'col-sm-3'l><'col-sm-4'p>>"
    });
};

var initialLoad = 0

//initial data table 
stormTracks.on('load', function(e){
    if (initialLoad ==0){
        makeResultTable()
        initialLoad = 1
    }
});

var popupTemplate = '<div id="popup"> \
    <span id="name">{NAME}</span><br> \
    Year: {YEAR}<br> \
    Max Wind: {MAXWIND}<br> \
    Min Pressure: {MINPRES}<br>\
    Max Category: {MAXSTAT} {HURCAT} <br> \
    <button class="btn btn-sm btn-outline-primary mt-2" id="popup-details">Get Storm Details <i class="fas fa-info-circle"></i></button></div>'

stormTracks.bindPopup(function(layer){
    return L.Util.template(popupTemplate,layer.feature.properties);
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

var updateTable = function(table){
    table.rows.add(tableData).draw();
}

var runFilters = function(){
        
    var exp = [getYearRange(), getCatList()].join(' ').replace('"','')
    
    //run the where filter for the arcgis online service
    stormTracks.setWhere([getYearRange(), getCatList()].join(' ').replace('"',''));
                         
    rt.clear() 
    
    tableData = []
    
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
        updateTable(rt);
    }); 
};

//FILTER BUTTON CLICKS 

$("#toggle-filters").on('click',function(){
    $("#storm-search").slideToggle( "slow" );
    $("#filter-icon").toggleClass("fa-filter, fa-times")
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

//!!!!!!!!!INSTEAD OF HAVING TWO FEATURE LAYER INSTANCES, SEE IF YOU CAN JUST CHANGE THE OPACITY BASED ON THE SELECTED ID!!!! 
var trackHighlight = L.esri.featureLayer({
    url: data,
    style: trackStyle,
    where:"KEY_=''"
}).addTo(map);

trackHighlight.bindPopup(function(layer){
    return L.Util.template(popupTemplate,layer.feature.properties);
});

var stormKey

$("#results-table").on( 'click', 'tr', function () {
    stormKey = rt.row( this ).id();
    trackHighlight.setWhere("KEY_ =''")
    $(".storm-select-btn").prop("disabled", false);
    stormTracks.setStyle({
        opacity:0.8
    });
});

$("#storm-track-btn").on('click', function(){
    trackHighlight.setWhere("KEY_ ='"+stormKey+"'")
    stormTracks.setStyle({
        opacity:0.05
    });
    $("#to-map").trigger('click');
});

var pointRad = function(cat) {
        return cat >= 1 ? cat * 4.5 :
            3;
    }

var pointColor = function(cat){
        return cat == 5 ? c5 :
         cat == 4 ? c4 :
         cat == 3 ? c3 :
         cat == 2 ? c2 :
         cat == 1 ? c1 :
            ct;
    }

//ADD POINTS FOR INDIVIDUAL STORMS
var pointData = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/sc_tropical_storms_points/FeatureServer/0"

var stormPoints = L.esri.featureLayer({
    url: pointData,
    pointToLayer: function(feature, latlng){
        return L.circleMarker(latlng, {
            radius:pointRad(feature.properties.HU_cat),
            fillColor:pointColor(feature.properties.HU_cat),
            color:pointColor(feature.properties.HU_cat),
            opacity:0.8,
            weight:2,
            fillOpacity:0.6
        });
    },
    where:"KEY_=''"
}).addTo(map);

var pointPopup = '<div> \
    Date and Time: {DATE_TIME}<br> \
    Status: {STATUS} {HU_cat}<br> \
    Wind: {WIND}<br> \
    Pressure: {PRESSURE}<br>\
    Record:{RECORD}  <br> \
    </div>'

stormPoints.bindTooltip(function(layer){
    return L.Util.template(pointPopup, layer.feature.properties);
});

var pointTableData = []

var makeDetailsTable = function(pData){
    dt = $('#details-table').DataTable({
        select:false,
        data: pData,
        language:{
            info:"_TOTAL_ storm advisories."
        },
        columns:[
            {data: 'DATE_TIME'},
            {data: 'STATUS'},
            {data: 'HU_cat'},
            {data: 'WIND'},
            {data: 'PRESSURE'},
            {data: 'RECORD'}
        ],
        responsive:true,
        pageLength:25,
        dom: "<'#t-details.row'<'col-sm-12'i>>t<'row'<'col-sm-3'l><'col-sm-4'p>>"
    });
};

var pointQuery = L.esri.query({
    url:pointData
});

//WHAT TO DO WHEN GET STORM DETAILS IS CLICKED

$("#storm-details-btn, #popup-details").on('click',function(){
    map.removeLayer(stormTracks);
    
    //keep individual track from highlight
    trackHighlight.setWhere("KEY_ = '"+stormKey+"'");
    trackHighlight.unbindPopup();
    //add individual points
    stormPoints.setWhere("KEY_ = '"+stormKey+"'");
    
    //remove the features no longer needed and add those for details
    $("#storm-select-row").addClass("d-none");
    $("#toggle-filters").addClass("d-none");
    $("#rt-row").addClass("d-none");
    
    $("#back-to-tracks").removeClass("d-none");
    $("#dt-row").removeClass("d-none");
    
    //clear the data table
    rt.clear().draw();
    
    //check to see if filters are displayed. if so, initiate a click on the filter button to suck it back up
    if ($("#storm-search").is(":visible")){
        $("#toggle-filters").trigger('click');
    }
    
    $("#storm-details-overview").slideToggle("slow");
    
    query.where("KEY_ = '"+stormKey+"'").returnGeometry(false);
    
    query.run(function(error,fc,response){
                $("#storm-name").text(fc.features[0].properties.NAME)
                $("#storm-year").text(fc.features[0].properties.YEAR)
                //$("#form-date").text(fc.features[0].properties.STARTDATE)
                $("#max-cat").text(fc.features[0].properties.MAXSTAT +" "+ fc.features[0].properties.HURCAT)
                $("#max-wind").text(fc.features[0].properties.MAXWIND)
                $("#min-pres").text(fc.features[0].properties.MINPRES)
    });
    
    pointQuery.where("KEY_ = '"+stormKey+"'").returnGeometry(false);
    
    pointQuery.run(function(error,fc,response){
        for (var i = 0; i < fc.features.length; i++){
            pointTableData.push({
                "DATE_TIME":fc.features[i].properties.DATE_TIME,
                "STATUS":fc.features[i].properties.STATUS,
                "HU_cat":fc.features[i].properties.HU_cat,
                "WIND":fc.features[i].properties.WIND,
                "PRESSURE":fc.features[i].properties.PRESSURE,
                "RECORD":fc.features[i].properties.RECORD
            });
        }
        makeDetailsTable(pointTableData);
        location.href = "#map";
    });
});



//WHAT TO DO WHEN WE CLICK BACK TO ALL STORMS??

//Modal for continuing and losing individual storm data
// if continue
    // clear results table
    // repopulate with all data
    // add all storms to map
    // clear any filters 
    // re-add buttons
    // remove storm details div and buttons
    // clear storm details table so it's not in back ground
    // 

$('a[href^="#"]').on('click',function (e) {
	    e.preventDefault();

	    var target = this.hash;
	    var $target = $(target);

	    $('html, body').stop().animate({
	        'scrollTop': $target.offset().top
	    }, 900, 'swing', function () {
	        window.location.hash = target;
	    });
	});  
