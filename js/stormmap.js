/*
TO DO
-----
CLEAN AND OPTIMIZE
lines are too hard to click
get more info button appears too high after getting details, and then going back.... sometimes
need zoom to bounds to work
width is weird on iphone SE... it's still a little too wide. 

TO BE DISCUSSED or do later
---------------
have map select row in table, table row selection make popup? 
download data
make icons for landfalls or records, highlight on map?

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
}).fitBounds([[21, -90],[52,-13]]);

var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    noWrap:true
}).addTo(map);

var data = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/sc_tropical_storms/FeatureServer/0"

var tableData = []
var rt

var checkForNull = function(invalue){
    if (invalue == null){
        return ""
    } else {
        return invalue
    }
}

var oef = function(feature,layer){
    tableData.push({
            "KEY":feature.properties.KEY_,
            "NAME":feature.properties.NAME,
            "YEAR":feature.properties.YEAR,
            "HURCAT":feature.properties.MAXSTAT + " " +checkForNull(feature.properties.HURCAT),
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

var stormTracks = L.esri.featureLayer({
    url: data,
    onEachFeature:oef,
    style:trackStyle,
    precision:4
}).addTo(map);

//load data table data from REST service
var query = L.esri.query({
    url:data
});

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

stormTracks.bindPopup(function(layer){
    return '<div id="popup"> \
    <span id="name">'+layer.feature.properties.NAME+'</span><br> \
    Year: ' +layer.feature.properties.YEAR+'<br> \
    Max Wind: '+checkForNull(layer.feature.properties.MAXWIND)+ '<br> \
    Min Pressure: '+checkForNull(layer.feature.properties.MINPRES)+'<br>\
    Max Category: '+checkForNull(layer.feature.properties.MAXSTAT)+" "+checkForNull(layer.feature.properties.HURCAT)+ '<br> \
    <button class="btn btn-sm btn-outline-primary mt-2" onclick="getDetailsMap()">Get Storm Details <i class="fas fa-info-circle"></i></button></div>'
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

var getLandfall = function(){
    if ($("#lfsc-check").is(":checked")){
        return "AND LandfallSC = 'y'"
        console.log("yerp!")
    }
}

var updateTable = function(table){
    table.rows.add(tableData).draw();
}

var runFilters = function(){
    
    var exp = [getYearRange(), "(", getCatList(),")",getLandfall()].join(' ').replace('"','')
    
    query.where(exp).returnGeometry(false);
    
    query.run(function(error,fc,response){
        if (fc == null || fc.features.length == 0) {
            $("#return-zero-modal").modal("show")
        } else {
            
            stormTracks.setWhere(exp);
                         
            rt.clear() 
    
            tableData = []
            
            for (var i = 0; i < fc.features.length; i++){
                tableData.push({
                    "KEY":fc.features[i].properties.KEY_,
                    "NAME":fc.features[i].properties.NAME,
                    "YEAR":fc.features[i].properties.YEAR,
                    "HURCAT":fc.features[i].properties.MAXSTAT + " " + checkForNull(fc.features[i].properties.HURCAT),
                    "COMMENTS":fc.features[i].properties.COMMENTS,
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
    trackHighlight.setWhere("KEY_ =''")
    runFilters();
    $("#to-map").triggerHandler('click');
});

$("#reset").on('click', function(){
    $('#startyear').val(1871);
    $('#endyear').val(2017);
});

//TABLE SELECTION INTERACTION WITH MAP

var trackHighlight = L.esri.featureLayer({
    url: data,
    style: trackStyle,
    where:"KEY_=''"
}).addTo(map);

trackHighlight.bindPopup(function(layer){
    return L.Util.template(popupTemplate,layer.feature.properties);
});

var stormKey
var oldKey
var selected = 0

// set storm key on table row click 
$("#results-table").on( 'click', 'td', function () {
    stormKey = rt.row( this ).id();
    if (oldKey != stormKey || oldKey == stormKey && selected == 0){
        oldKey = stormKey
        trackHighlight.setWhere("KEY_ ='"+stormKey+"'")
        stormTracks.setStyle({
            opacity:0.12
        });
        $(".storm-btn").prop("disabled", false);
        selected = 1
    } else {
        trackHighlight.setWhere("KEY_ =''")
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

stormTracks.on('click', function(e) { 
    mapClickKey = e.layer.feature.properties.KEY_ 
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
    });
    
stormPoints.bindTooltip(function(layer){
    return '<div> \
    Date and Time: '+layer.feature.properties.DATE_TIME+'<br> \
    Status: '+layer.feature.properties.STATUS+' '+checkForNull(layer.feature.properties.HU_cat)+'<br> \
    Wind: '+layer.feature.properties.WIND+'<br> \
    Pressure: '+checkForNull(layer.feature.properties.PRESSURE)+'<br>\
    Record: '+checkForNull(layer.feature.properties.RECORD)+'<br> \
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

var getDetails = function(key){
    map.removeLayer(stormTracks);
    
    stormPoints.addTo(map);
    stormPoints.setWhere("KEY_ = '"+key+"'");
    
    //keep individual track from highlight
    trackHighlight.setWhere("KEY_ = '"+key+"'");
    trackHighlight.unbindPopup();
    //add individual points
    
    //remove the features no longer needed and add those for details
    $("#storm-select-row").addClass("d-none");
    $("#toggle-filters").addClass("d-none");
    $("#rt-row").addClass("d-none");
    
    $("#back-to-tracks").removeClass("d-none");
    $("#dt-row").removeClass("d-none");
    
    $("#toggle-legend").attr("data-target","#icon-legend-modal");
    
    //clear the data table
    rt.clear().draw();
    
    //check to see if filters are displayed. if so, initiate a click on the filter button to suck it back up
    //disable filter button on mobile icon bar
    if ($("#storm-search").is(":visible")){
        $("#toggle-filters").triggerHandler('click');
    }
    $("#to-filter").addClass("disabled");
    
    $("#storm-details-overview").slideToggle("slow");
    
    query.where("KEY_ = '"+key+"'");
    
    pointTableData = []
    
    var nullReports = function(inValue){
        if (inValue == null){
            return "No"
        } else {
            return '<a href="'+inValue+'" target="_blank">'
        }
    }
    
    var nullDate = function(inDate){
        if (inDate == null){
            return ""
        } else {
            return new Date(inDate).toLocaleDateString()
        }
    }
     
    query.run(function(error,fc,response){
                $("#storm-name").text(fc.features[0].properties.NAME)
                $("#storm-year").text(fc.features[0].properties.YEAR)
                
                $("#form-date").text(new Date(fc.features[0].properties.STARTDATE).toLocaleDateString())
        
                $("#sc-date-st").text(new Date(fc.features[0].properties.SC_DATE_START).toLocaleDateString())
                $("#sc-date-end").text(nullDate(fc.features[0].properties.SC_DATE_END))
        
                $("#lf-loc").text(fc.features[0].properties.LF_LOC)
                $("#max-cat").text(checkForNull(fc.features[0].properties.MAXSTAT) +" "+ checkForNull(fc.features[0].properties.HURCAT))
                $("#max-wind").text(fc.features[0].properties.MAXWIND)
                $("#min-pres").text(fc.features[0].properties.MINPRES)
                $("#comments").text(fc.features[0].properties.COMMENTS)
                $("#report").html(nullReports(fc.features[0].properties.REPORT_URL)+' Storm Report</a>')
                $("#damage").html(nullReports(fc.features[0].properties.REPORT_URL)+' Damage Report</a>')
    });
    
    pointQuery.where("KEY_ = '"+key+"'");
    
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
    getDetails(stormKey);
});
var getDetailsMap = function(){
    stormKey = mapClickKey
    getDetails(mapClickKey); 
};

var stormReset = function (){
    
    stormTracks.setWhere();
    map.flyToBounds([[21, -90],[52,-13]]);
    stormTracks.setStyle({
        opacity:0.8
    });
    rt.clear();
    //indicates that there is not a selected row - for track highlighting on table row click - see table.on(click) function
    selected = 0
    //reset years
    $('#startyear').val(1871);
    $('#endyear').val(2017);
    //reset categories
    $("#storm-cat-group input:checkbox").prop('checked',true);
    $("#lfsc-check").prop('checked',false);
    
    runFilters();
}

$("#continue-back").on('click',function(){
    
    stormPoints.setWhere("KEY_ = ''");
    
    //map.removeLayer(stormPoints);
    stormTracks.addTo(map);
    
    trackHighlight.setWhere("KEY_ = ''");
    trackHighlight.bindPopup();
    
    dt.destroy();
    
    stormReset();
    
    $("#to-filter").removeClass("disabled");
    $(".storm-btn").prop("disabled", true);
    
    //remove the features no longer needed and add those for details
    $("#storm-select-row").removeClass("d-none");
    $("#toggle-filters").removeClass("d-none");
    $("#rt-row").removeClass("d-none");
    
    $("#back-to-tracks").addClass("d-none");
    $("#dt-row").addClass("d-none");
    
    $("#toggle-legend").attr("data-target","#trackline-legend-modal");
    
    $("#storm-details-overview").slideToggle("slow");
});
    
$("#continue-clear").on('click', function(){
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