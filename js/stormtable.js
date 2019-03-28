/*
THIS JS IS TO CREATE THE SIMPLER TABLE VERSION OF THE APPLICATION

STEPS:
query feature layer and pre-1851 table using query function from esriLeaflet
return all features without geometry
put in to data table

*/

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

var checkDateNull = function(invalue){
    if (invalue == null){
        return ""
    } else {
        d = new Date(invalue)
        return d.getMonth() + "/" + d.getDate();
    }
}

//~~~ NEW QUERY AND FUNCTION FOR PUSHING PRE-1851 DATA TO THE tableData ARRAY. 
// THIS WILL MAKE PRE-1851 DATA SHOW UP IN TABLE BECAUSE tableData IS USED TO MAKE DATA TABLES TABLE.

//load data table data from REST service
var query = L.esri.query({
    url:data
}).returnGeometry(false);



var oef = function(feature,layer){
    tableData.push({
            //"KEY":feature.properties.stormkey,
            "NAME":feature.properties.stormname,
            "YEAR":feature.properties.stormyear,
            "SCDATES":checkDateNull(feature.properties.scstartdate) + " - " + checkDateNull(feature.properties.scenddate),
            "SCCAT":feature.properties.scstatus+" "+checkForNull(feature.properties.schurcat),
            "MAXCAT":feature.properties.status+" "+checkForNull(feature.properties.hurcat),
            "COMMENTS":feature.properties.comments
        });
}

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
            {data: 'SCCAT'},
            {data: 'MAXCAT'},
            {data: 'COMMENTS', orderable:false}
        ],
        rowId:'KEY',
        pageLength:25,
        dom: "<'#t-search.row'<'col-sm-8'f><'col-sm-4'i>>t<'row'<'col-sm-3'l><'col-sm-4'p>>"
    });
};

makeResultTable()

var popup = function(layer){
    return '<div id="popup"> \
    <span id="name">'+layer.feature.properties.stormname+'</span><br> \
    Year: ' +layer.feature.properties.stormyear+'<br> \
    Dates in SC: '+checkDateNull(layer.feature.properties.scstartdate)+' - '+checkDateNull(layer.feature.properties.scenddate)+'<br> \
    Max Wind: '+(layer.feature.properties.maxwind*1.15078).toFixed(0) + ' mph<br> \
    Min Pressure: '+checkForNull(layer.feature.properties.minpres)+ ' mb<br>\
    Max Category: '+checkForNull(layer.feature.properties.status)+" "+checkForNull(layer.feature.properties.hurcat)+ '<br> \
    <button class="btn btn-sm btn-primary mt-2" onclick="getDetailsMap()">Get Storm Details <i class="fas fa-info-circle"></i></button></div>'
};

var updateTable = function(table){
    table.rows.add(tableData).draw();
}

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

var nullDate = function(inDate){
    if (inDate == null){
        return ""
    } else {
        return new Date(inDate).toLocaleDateString()
    }
}

var nullTornadoes = function(inTornado){
    if (inTornado == null){
        return ""
    } else {
        return "There were "+inTornado+" tornadoes reported in South Carolina."
    }
}


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
})
