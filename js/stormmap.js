/*
TO DO
-----
CLEAN AND OPTIMIZE
clear filters not resetting table
validate filter fields
add legends
get rid of null in popups

TO BE DISCUSSED or do later
---------------
download data
make icons for landfalls or records, highlight on map?

*/
var map = L.map('map', {
    doubleClickZoom:'center',
    wheelPxPerZoomLevel:100
}).fitBounds([[21, -90],[52,-13]]);

var Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    noWrap: true
}).addTo(map);

var data = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/sc_tropical_storms/FeatureServer/0"

var tableData = []
var rt

var oef = function(feature,layer){
    tableData.push({
            "KEY":feature.properties.KEY_,
            "NAME":feature.properties.NAME,
            "YEAR":feature.properties.YEAR,
            "HURCAT":feature.properties.HURCAT,
            "COMMENTS":feature.properties.COMMENTS
        });
}

var c1 = "#feb24c",
    c2 = "#fd8d3c",
    c3 = "#fc4e2a",
    c4 = "#e31a1c",
    c5 = "#b10026",
    ct = "#76e2ce"

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
            {data: 'HURCAT'},
            {data: 'COMMENTS'}
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
    <button class="btn btn-sm btn-outline-primary mt-2" onclick="getDetails()">Get Storm Details <i class="fas fa-info-circle"></i></button></div>'

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
        
    var exp = [getYearRange(), "(", getCatList(),")"].join(' ').replace('"','')
    
    console.log(exp)
    //run the where filter for the arcgis online service
    stormTracks.setWhere(exp);
                         
    rt.clear() 
    
    tableData = []
    
    query.where(exp).returnGeometry(false);
    
    query.run(function(error,fc,response){
        for (var i = 0; i < fc.features.length; i++){
            tableData.push({
                "KEY":fc.features[i].properties.KEY_,
                "NAME":fc.features[i].properties.NAME,
                "YEAR":fc.features[i].properties.YEAR,
                "HURCAT":fc.features[i].properties.HURCAT,
                "COMMENTS":fc.features[i].properties.COMMENTS,
            });
        }
        updateTable(rt);
    }); 
};

//FILTER BUTTON CLICKS 

$("#toggle-filters").on('click',function(){
    $("#storm-search").slideToggle( "slow", function(){
        Waypoint.refreshAll()
    });
    $("#filter-icon").toggleClass("fa-filter, fa-times");
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
    $("#to-map").triggerHandler('click');
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

// set storm key on table row click
$("#results-table").on( 'click', 'tr', function () {
    stormKey = rt.row( this ).id();
    trackHighlight.setWhere("KEY_ =''")
    $(".storm-btn").prop("disabled", false);
    stormTracks.setStyle({
        opacity:0.8
    });
});

//set storm key on track click
stormTracks.on('click', function(e) { 
    stormKey = e.layer.feature.properties.KEY_ 
    console.log(stormKey)
});

$(".storm-track-btn").on('click', function(){
    trackHighlight.setWhere("KEY_ ='"+stormKey+"'")
    stormTracks.setStyle({
        opacity:0.05
    });
    $("#to-map").triggerHandler('click');
});

$("#to-filter").on('click', function(){
    if ( ! $("#storm-search").is(":visible")){
        $("#toggle-filters").triggerHandler('click');
    }
});

var icons = {
    c1: L.icon({
      iconUrl: 'images/c1.png',
      iconSize: [30.8, 28]
    }),
    c2: L.icon({
      iconUrl: 'images/c2.png',
      iconSize: [34.1, 31]
    }),
    c3: L.icon({
      iconUrl: 'images/c3.png',
      iconSize: [37.4, 34]
    }),
    c4: L.icon({
      iconUrl: 'images/c4.png',
      iconSize: [40.7, 37]
    }),
    c5: L.icon({
      iconUrl: 'images/c5.png',
      iconSize: [44, 40]
    }),
    td: L.icon({
        iconUrl: 'images/ts.png',
        iconSize: [27.5, 25]
    }),
    l: L.icon({
        iconUrl: 'images/tl.png',
        iconSize: [15, 13.5]
    }),
  };

var getIcons = function(cat){
        return cat == 'HU5' ? icons['c5'] :
         cat == 'HU4' ? icons['c4'] :
         cat == 'HU3' ? icons['c3'] :
         cat == 'HU2' ? icons['c2'] :
         cat == 'HU1' ? icons['c1'] :
         cat == 'TD' ? icons['td'] :
            icons['l'];
    }

//ADD POINTS FOR INDIVIDUAL STORMS
var pointData = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/sc_tropical_storms_points/FeatureServer/0"

var stormPoints = L.esri.featureLayer({
        url: pointData,
        pointToLayer: function(feature, latlng){
            return L.marker(latlng, {
                icon: getIcons(feature.properties.STAT_CAT),
                pane: 'markerPane'
            });
        },
        where:"KEY_ = '"+stormKey+"'"
    }).addTo(map);
    
stormPoints.bindTooltip(function(layer){
    return L.Util.template(pointPopup, layer.feature.properties);
});

var pointPopup = '<div> \
    Date and Time: {DATE_TIME}<br> \
    Status: {STATUS} {HU_cat}<br> \
    Wind: {WIND}<br> \
    Pressure: {PRESSURE}<br>\
    Record:{RECORD}  <br> \
    </div>'

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

var getDetails = function(){
    map.removeLayer(stormTracks);
    
    stormPoints.setWhere("KEY_ = '"+stormKey+"'");
    
    //keep individual track from highlight
    trackHighlight.setWhere("KEY_ = '"+stormKey+"'");
    trackHighlight.unbindPopup();
    //add individual points
    
    //remove the features no longer needed and add those for details
    $("#storm-select-row").addClass("d-none");
    $("#toggle-filters").addClass("d-none");
    $("#rt-row").addClass("d-none");
    
    $("#back-to-tracks").removeClass("d-none");
    $("#dt-row").removeClass("d-none");
    
    //clear the data table
    rt.clear().draw();
    
    //check to see if filters are displayed. if so, initiate a click on the filter button to suck it back up
    //disable filter button on mobile icon bar
    if ($("#storm-search").is(":visible")){
        $("#toggle-filters").triggerHandler('click');
    }
    $("#to-filter").addClass("disabled");
    
    $("#storm-details-overview").slideToggle("slow");
    
    query.where("KEY_ = '"+stormKey+"'");
    
    query.bounds(function(error, latLngBounds, response){
        map.flyToBounds(latLngBounds, {
            padding:[20,20]
        });
    });
    
    query.run(function(error,fc,response){
                $("#storm-name").text(fc.features[0].properties.NAME)
                $("#storm-year").text(fc.features[0].properties.YEAR)
                $("#form-date").text(fc.features[0].properties.STARTDATE)
                //dates affecting SC
                $("#lf-loc").text(fc.features[0].properties.LF_LOC)
                $("#max-cat").text(fc.features[0].properties.MAXSTAT +" "+ fc.features[0].properties.HURCAT)
                $("#max-wind").text(fc.features[0].properties.MAXWIND)
                $("#min-pres").text(fc.features[0].properties.MINPRES)
                $("#comments").text(fc.features[0].properties.COMMENTS)
                $("#report").html('<a href="'+fc.features[0].properties.REPORT_URL+'" target="_blank">Storm Report</a>')
                $("#damage").html('<a href="'+fc.features[0].properties.DAMAGE_URL+'" target="_blank">Damage Report</a>')
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
}

$(".details-btn").on('click',function(){
    getDetails();
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

var stormReset = function (){
    
    stormTracks.setWhere();
    map.flyToBounds([[21, -90],[52,-13]]);
    stormTracks.setStyle({
        opacity:0.8
    });
    
    rt.clear();
    
    query.run(function(error,fc,response){
        for (var i = 0; i < fc.features.length; i++){
            console.log("push")
            tableData.push({
                "KEY":fc.features[i].properties.KEY_,
                "NAME":fc.features[i].properties.NAME,
                "YEAR":fc.features[i].properties.YEAR,
                "HURCAT":fc.features[i].properties.HURCAT,
                "COMMENTS":fc.features[i].properties.COMMENTS,
            });
        }
    });
    
    updateTable(rt);   
}

$("#back-to-tracks").on('click',function(){
    
    map.removeLayer(stormPoints);
    stormTracks.addTo(map);
    
    trackHighlight.setWhere("KEY_ = ''");
    trackHighlight.bindPopup();
    
    stormReset();
    
    $("#to-filter").removeClass("disabled");
    
    //remove the features no longer needed and add those for details
    $("#storm-select-row").removeClass("d-none");
    $("#toggle-filters").removeClass("d-none");
    $("#rt-row").removeClass("d-none");
    
    $("#back-to-tracks").addClass("d-none");
    $("#dt-row").addClass("d-none");
    
    $("#storm-details-overview").slideToggle("slow");
});
    
$("#clear-filter").on('click', function(){
    stormReset();
});

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


var waypoint = new Waypoint({
  element: document.getElementById('rt-row'),
  handler: function() {
      $("#sticky-buttons").toggleClass("no-vis");
  }
});

