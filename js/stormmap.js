/*
TO DO
-----
Need to figure out why side icon for details gets stuck farther up whenever the filter box is open when going back from a storm detail 

TO BE DISCUSSED or do later
---------------
have map select row in table, table row selection make popup? 

*/
var map = L.map('map', {
    doubleClickZoom:'center',
    wheelPxPerZoomLevel:100,
    maxZoom: 10,
    minZoom: 3,
    maxBounds: [
        [70.77, -174.67],
        [-12.89, 90.37]
    ]
}).setView([31.044741, -70.804940],4);

var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    noWrap:true
}).addTo(map);

var scoutline = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/SCOutline/FeatureServer/0"

var outline = L.esri.featureLayer({
    url: scoutline,
    simplifyFactor: 0.5,
    pane: 'shadowPane',
    style: {
        weight:2,
        color:'white',
        fill:false
    }
    
}).addTo(map);


var data = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/SC_Hurricanes_Public/FeatureServer/1"

//~~~ ADD URL TO PRE-1851 TABLE DATA

var tableData = []
var rt

var checkForNull = function(invalue){
    if (invalue == null){
        return ""
    } else {
        return invalue
    }
}

var checkForDateNull = function(inValDate) {
    if (inValDate == null){
        return ""
    } else {
        return inValDate.substring(0,5)
    }
}

var oef = function(feature,layer){
    tableData.push({
            "KEY":feature.properties.stormkey,
            "NAME":feature.properties.stormname,
            "YEAR":feature.properties.stormyear,
            "SCDATES":checkForDateNull(feature.properties.scstartdate_txt) + " - " + checkForDateNull(feature.properties.scenddate_txt),
            //"SCCAT":feature.properties.scstatus+" "+checkForNull(feature.properties.schurcat),
            //"MAXCAT":feature.properties.status+" "+checkForNull(feature.properties.hurcat),
            "COMMENTS":feature.properties.comments
        });
}

var c1 = "#feb24c",
    c2 = "#fd8d3c",
    c3 = "#fc4e2a",
    c4 = "#e31a1c",
    c5 = "#b10026",
    ct = "#76e2ce"

var trackStyle = function(feature){
      var c,w,d = false
      switch (feature.properties.hurcat) {
        case 1:
          c = c1;
          w = 1.2
          break;
        case 2:
          c = c2;
              w = 1.4
          break;
        case 3:
          c = c3;
              w = 1.6
          break;
        case 4:
          c = c4;
              w = 1.8
          break;
        case 5:
          c = c5;
              w = 2
          break;      
        default:
          c = ct;
              w = 1.2;
              d = "8 3"
      }
      return {color: c, opacity: 0.8, weight: w, dashArray:d};
    }

//extra layer with large width to make clicking lines possible
var stormTracksClick = L.esri.featureLayer({
    url: data,
    precision:3,
    style: {
        opacity:0,
        weight:10
    }
}).addTo(map);

var stormTracks = L.esri.featureLayer({
    url: data,
    onEachFeature:oef,
    style:trackStyle,
    precision:4
}).addTo(map);

var stormTracksGroup = L.layerGroup([stormTracks, stormTracksClick]);

//load data table data from REST service
var query = L.esri.query({
    url:data
});

//set min and max dates for filters
var mindate = 1851
var maxdate = new Date().getFullYear()-1
$('#startyear').val(mindate).attr("max",maxdate-1).attr("min",mindate).attr("value", mindate);
$('#endyear').val(maxdate).attr("max",maxdate).attr("min",mindate+1).attr("value", maxdate);

var makeResultTable = function(){
    rt = $('#results-table').DataTable({
        language:{
            search:"Search",
            searchPlaceholder:"Name, year, keywords",
            info:"_TOTAL_ storms",
            infoFiltered: " of _MAX_ total",
            infoEmpty: "_TOTAL_ storms"
        },
        select:true,
        pagingType:'simple',
        data: tableData,
        order: [[ 1, "desc" ]],
        responsive:true,
        autoWidth: false,
        columns:[
            {data: 'NAME'},
            {data: 'YEAR'},
            {data: 'SCDATES', width:"12%", orderable:false},
            //{data: 'SCCAT'},
            //{data: 'MAXCAT'},
            {data: 'COMMENTS', orderable:false}
        ],
        rowId:'KEY',
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

var popup = function(layer){
    return '<div id="popup"> \
    <span id="name">'+layer.feature.properties.stormname+'</span><br> \
    Year: ' +layer.feature.properties.stormyear+'<br> \
    Dates in SC: '+checkForDateNull(layer.feature.properties.scstartdate_txt)+' - '+checkForDateNull(layer.feature.properties.scenddate_txt)+'<br> \
    Max Wind: '+(layer.feature.properties.maxwind*1.15078).toFixed(0) + ' mph<br> \
    Min Pressure: '+checkForNull(layer.feature.properties.minpres)+ ' mb<br>\
    Max Category: '+checkForNull(layer.feature.properties.status)+" "+checkForNull(layer.feature.properties.hurcat)+ '<br> \
    <button class="btn btn-sm btn-primary mt-2" onclick="getDetailsMap()">Get Storm Details <i class="fas fa-info-circle"></i></button></div>'
};

stormTracksClick.bindPopup(popup);

var getCatList = function(){
    var catList = []
    var catNull = ""
    var huWhere = ""
    var operator = ""
    var catField
    
    if ($("#cat-filter-select").val() == 1) {
        catField = "hurcat"
        //console.log("hurcat")
    } else {
        catField = "schurcat"
        //console.log("sc_cat")
    }
    
    $("#storm-cat-group input:checkbox").each(function(){
        if (!$(this).hasClass('hu') && $(this).is(':checked')){
            catNull = catField + " IS NULL"
        } else if ($(this).is(':checked')){
            catList.push($(this).val());
        }
    });
    
    if (catList.length > 0 && catNull.length > 0) {
        operator = "OR"
        huWhere = catField + " IN ("+catList.toString()+")"
    } else if (catList.length > 0 && catNull.length == 0){
        huWhere = catField + " IN ("+catList.toString()+")"
    }
    
    return [huWhere,operator,catNull].join(' ');
};

var getYearRange = function(){
    return "stormyear >= '"+$('#startyear').val()+"' AND stormyear <='"+$('#endyear').val()+"' AND";
}

var getLandfall = function(){
    if ($("#lfsc-check").is(":checked")){
        return "AND sclandfall = 'y'"
    }
}

var getTornadoes = function(){
    var t
    switch ($("input[name='tornadoCheck']:checked").val()) {
        case "t0":
            t = ""
          break;
        case "t1":
            t = "AND sctornadoes < 5"
          break;
        case "t2":
            t = "AND (sctornadoes >= 5 AND sctornadoes <= 20)"
          break;
        case "t3":
            t = "AND sctornadoes > 20"
          break;
      }
      return t;
} 

var updateTable = function(table){
    table.rows.add(tableData).draw();
}

var runFilters = function(){
    
    //console.log(getTornadoes());
    
    var exp = [getYearRange(),"(", getCatList(),")",getLandfall(),getTornadoes()].join(' ').replace('"','')
    
    query.where(exp).returnGeometry(false);
    
    query.run(function(error,fc,response){
        if (fc == null || fc.features.length == 0) {
            $("#return-zero-modal").modal("show")
        } else {
            
            stormTracks.setWhere(exp);
            stormTracksClick.setWhere(exp);
                         
            rt.clear() 
    
            tableData = []
            
            for (var i = 0; i < fc.features.length; i++){
                tableData.push({
                    "KEY":fc.features[i].properties.stormkey,
                    "NAME":fc.features[i].properties.stormname,
                    "YEAR":fc.features[i].properties.stormyear,
                    "SCDATES":checkForDateNull(fc.features[i].properties.scstartdate_txt) + " - " + checkForDateNull(fc.features[i].properties.scenddate_txt),
                    //"SCCAT":fc.features[i].properties.scstatus+" "+checkForNull(fc.feature[i].properties.schurcat),
                    //"MAXCAT":fc.features[i].properties.status+" "+checkForNull(fc.feature[i].properties.hurcat),
                    "COMMENTS":fc.features[i].properties.comments
                });
            }
            updateTable(rt);
        }
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
    //trackHighlight.setWhere("stormkey =''")
    runFilters();
    $("#to-map").triggerHandler('click');
});

$("#reset").on('click', function(){
    $('#startyear').val(mindate);
    $('#endyear').val(maxdate);
});

//TABLE SELECTION INTERACTION WITH MAP

var highlightStyle = function(feature){
      switch (feature.properties.stormkey) {
        case stormKey:
          o = 1;
          break;    
        default:
          o = 0.12      
      }
      return {opacity: o};
    }

var stormKey
var oldKey
var selected = 0

// set storm key on table row click 
$("#results-table").on( 'click', 'td', function () {
    stormKey = rt.row( this ).id();
    map.closePopup();
    if (oldKey != stormKey || oldKey == stormKey && selected == 0){
        oldKey = stormKey
        stormTracks.setStyle(highlightStyle);
        $(".storm-btn").prop("disabled", false);
        selected = 1
    } else {
        stormTracks.setStyle({
            opacity:0.8
        });
        $(".storm-btn").prop("disabled", true);
        selected = 0
    } 
});

//set storm key on track click - keep it separate until the get details button in popup is clicked
//this keeps from confusion between keys set in the map and the table
var mapClickKey

function clickTracks_On() {
    stormTracksClick.on('click', function(e) { 
        mapClickKey = e.layer.feature.properties.stormkey
        stormKey = mapClickKey
        stormTracks.setStyle(highlightStyle)
        rt.rows().deselect();
    });
}    
clickTracks_On()

map.on('popupclose', function(e){
    stormTracks.setStyle({
        opacity:0.8
    });
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
    ts: L.icon({
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
         cat == 'TS' ? icons['ts'] :
            icons['l'];
    }

//ADD POINTS FOR INDIVIDUAL STORMS
var pointData = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/SC_Hurricanes_Public/FeatureServer/0"

var stormPoints = L.esri.featureLayer({
        url: pointData,
        pointToLayer: function(feature, latlng){
            return L.marker(latlng, {
                icon: getIcons(feature.properties.statcat),
                pane: 'markerPane'
            });
        },
        where:"stormkey = '"+stormKey+"'"
    });
    
stormPoints.bindTooltip(function(layer){
    return '<div> \
    Date and Time (EST): '+ layer.feature.properties.datetime_est_text +'<br> \
    Status: '+layer.feature.properties.status+' '+checkForNull(layer.feature.properties.hurcat)+'<br> \
    Wind (mph): '+(layer.feature.properties.wind*1.15078).toFixed(0)+'<br> \
    Pressure (mb): '+checkForNull(layer.feature.properties.pressure)+'<br>\
    </div>'
});

var pointTableData

var makeDetailsTable = function(pData){
    dt = $('#details-table').DataTable({
        select:false,
        data: pData,
        language:{
            info:"_TOTAL_ storm advisories."
        },
        pagingType:'simple',
        autoWidth: false,
        columns:[
            {data: 'sortdate', visible:false, order:'asc'},
            {data: 'datetime', orderable:false},
            {data: 'status', orderable:false},
            {data: 'wind', orderable:false},
            {data: 'pressure', orderable:false}
        ],
        responsive:true,
        pageLength:25,
        dom: "<'#t-details.row'<'col-sm-12'i>>t<'row'<'col-sm-3'l><'col-sm-4'p>>"
    });
};

var pointQuery = L.esri.query({
    url:pointData
});

var nullStormReport = function(inValue){
    if (inValue == null){
        return ""
    } else {
        return '<a href="'+inValue+'" target="_blank">Storm Report</a>'
    }
}

var nullDamageReport = function(inValue){
    if (inValue == null){
        return ""
    } else {
        return ' | &nbsp;<a href="'+inValue+'" target="_blank">Damage Report</a>'
    }
}

//should be the same function as checknulldate...
/*var nullDate = function(inDate){
    if (inDate == null){
        return ""
    } else {
        return inDate
    }
}*/

var nullTornadoes = function(inTornado){
    if (inTornado == null){
        return ""
    } else {
        return "There were "+inTornado+" tornadoes reported in South Carolina."
    }
}

//WHAT TO DO WHEN GET STORM DETAILS IS CLICKED

var getDetails = function(key){

    //check to see if filters are displayed. if so, initiate a click on the filter button to suck it back up
    //disable filter button on mobile icon bar
    if ($("#storm-search").is(":visible")){
        $("#toggle-filters").triggerHandler('click');
    }
    
    map.closePopup();
    
    stormTracksClick.off('click');
    stormTracksClick.unbindPopup();
    
    stormPoints.addTo(map);
    stormPoints.setWhere("stormkey = '"+key+"'");

    stormTracks.setStyle(highlightStyle);
    
    //add individual points
    
    //remove the features no longer needed and add those for details
    $("#storm-select-row").addClass("d-none");
    $("#toggle-filters").addClass("d-none");
    $("#rt-row").addClass("d-none");
    
    $("#back-to-tracks").removeClass("d-none");
    $("#dt-row").removeClass("d-none");
    
    $("#to-filter").addClass("d-none");
    $("#to-details").removeClass("d-none");
    
    $("#toggle-legend").attr("data-target","#icon-legend-modal");
    
    //clear the data table
    rt.clear().draw();
    
    $("#storm-details-overview").slideToggle("slow");
    
    query.where("stormkey = '"+key+"'");
    
    pointTableData = []
     
    query.run(function(error,fc,response){
        
                if (fc.features[0].properties.status == "HU") {
                    $("#storm-cat").text("HURRICANE");
                } else {
                    $("#storm-cat").text("TROPICAL STORM");
                }
        
                $("#storm-name").text(fc.features[0].properties.stormname)
                $("#storm-year").text(fc.features[0].properties.stormyear)
                
                $("#form-date").text(checkForNull(fc.features[0].properties.startdate_est_txt))
        
                $("#sc-date-st").text(checkForDateNull(fc.features[0].properties.scstartdate_txt))
                $("#sc-date-end").text(checkForDateNull(fc.features[0].properties.scenddate_txt))
        
                $("#lf-loc").text(fc.features[0].properties.landfalls)
                $("#max-cat").text(fc.features[0].properties.status +" "+ checkForNull(fc.features[0].properties.hurcat))
                $("#sc-cat").text(fc.features[0].properties.scstatus+" "+ checkForNull(fc.features[0].properties.schurcat))
                $("#max-wind").text((fc.features[0].properties.maxwind*1.15078).toFixed(0))
                $("#min-pres").text(fc.features[0].properties.minpres)
                $("#comments").text(fc.features[0].properties.comments)
        
                $("#tornadoes").text(nullTornadoes(fc.features[0].properties.sctornadoes))
        
                $("#report").html(nullStormReport(fc.features[0].properties.reporturl))
                $("#damage").html(nullDamageReport(fc.features[0].properties.damageurl))
                $("#trackmap").html("<a href='./trackmaps/"+fc.features[0].properties.stormkey+"_map.png' target='_blank'>Track Map</a>")
        
                $("#print-map").html("<img class='img-fluid' src='./trackmaps/"+fc.features[0].properties.stormkey+"_map.png' alt='track map image for printing'/>")
    });
    
    pointQuery.where("stormkey = '"+key+"'");
    
    pointQuery.run(function(error,fc,response){
        for (var i = 0; i < fc.features.length; i++){
            pointTableData.push({
                "sortdate":fc.features[i].properties.datetime,
                "datetime":fc.features[i].properties.datetime_est_text,
                "status":fc.features[i].properties.status + checkForNull(fc.features[i].properties.hurcat),
                "wind":fc.features[i].properties.wind,
                "pressure":fc.features[i].properties.pressure
            });
        }
        makeDetailsTable(pointTableData);
        location.href = "#map";
    });
    
}

$(".details-btn").on('click',function(){
    getDetails(stormKey);
});

var getDetailsMap = function(){
    //don't need this below because we do it on click... i think
    //stormKey = mapClickKey
    getDetails(mapClickKey); 
};

var stormReset = function (keepOrReset){
    
    map.setView([31.044741, -70.804940],4);
    stormTracks.setStyle({
        opacity:0.8
    });
    rt.clear();
    
    clickTracks_On()
    //indicates that there is not a selected row - for track highlighting on table row click - see table.on(click) function
    selected = 0
    
    if (keepOrReset == "reset"){
        
        stormTracks.setWhere();
        stormTracksClick.setWhere();
        
        //reset years
        $('#startyear').val(mindate);
        $('#endyear').val(maxdate);
        //reset categories
        $("#storm-cat-group input:checkbox").prop('checked',true);
        $("#lfsc-check").prop('checked',false);
        $("#tornadoesNone").prop("checked", true);
        $("#cat-filter-select").val(1);
        
        runFilters();
        
    } else if (keepOrReset == "keep") {

        runFilters();
    }
}

var resetUI = function(){
    $("#to-filter").removeClass("disabled");
    $(".storm-btn").prop("disabled", true);
    
    //remove the features no longer needed and add those for details
    $("#storm-select-row").removeClass("d-none");
    $("#toggle-filters").removeClass("d-none");
    $("#rt-row").removeClass("d-none");
    
    $("#back-to-tracks").addClass("d-none");
    $("#dt-row").addClass("d-none");
    
    $("#to-filter").removeClass("d-none");
    $("#to-details").addClass("d-none");
    
    $("#toggle-legend").attr("data-target","#trackline-legend-modal");
    
    $("#storm-details-overview").slideToggle("slow");
}

$("#continue-back").on('click',function(){
    
    stormPoints.setWhere("stormkey = ''");
    
    stormTracksClick.bindPopup(popup);
    
    dt.destroy();
    
    stormReset("reset");
    resetUI();    
    
});
    
$("#continue-back-keep").on('click',function(){
    
    stormPoints.setWhere("stormkey = ''");
    
    stormTracksClick.bindPopup(popup);
    
    dt.destroy();
    
    stormReset("keep");
    resetUI();
    
});


$("#continue-clear").on('click', function(){
    stormReset("reset");
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


//OTHER SMALL PIECES OF FUNCTIONALITY

var waypoint = new Waypoint({
  element: document.getElementById('table-container'),
  handler: function() {
      $("#sticky-buttons").toggleClass("no-vis");
  },
    offset:-70
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});
