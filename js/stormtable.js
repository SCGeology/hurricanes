/*
THIS JS IS TO CREATE THE SIMPLER TABLE VERSION OF THE APPLICATION

STEPS:
query feature layer and pre-1851 table using query function from esriLeaflet
return all features without geometry
put in to data table

*/

var data = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/SC_Hurricanes_Public/FeatureServer/1"

var predata = "https://services.arcgis.com/acgZYxoN5Oj8pDLa/arcgis/rest/services/SC_Hurricanes_Public/FeatureServer/2"
//~~~ ADD URL TO PRE-1851 TABLE DATA

var tableData = []
var preTableData = []
var rt
var pt

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

var makeStormTable = function(){
    rt = $('#results-table').DataTable({
        language:{
            search:"Search",
            searchPlaceholder:"Name, year, keywords",
            info:"_TOTAL_ storms",
            infoFiltered: " of _MAX_ total",
            infoEmpty: "_TOTAL_ storms"
        },
        //select:true,
        pagingType:'simple',
        data: tableData,
        order: [[ 1, "desc" ]],
        responsive:true,
        autoWidth: false,
        columns:[
            {data: 'NAME'},
            {data: 'YEAR'},
            {data: 'MAXCAT'},
            {data: 'MINPRES'},
            {data: 'MAXWIND'},
            {data: 'SCCAT'},
            {data: 'SCDATES', width:"12%", orderable:false},
            {data: 'COMMENTS', orderable:false}
        ],
        //rowId:'KEY',
        pageLength:25,
        dom: "<'#t-search.row'<'col-sm-8'f><'col-sm-4'i>>t<'row'<'col-sm-3'l><'col-sm-4'p>>"
    });
};

var makePreTable = function(){
    console.log(preTableData)
    pt = $('#pre-table').DataTable({
        language:{
            search:"Search",
            searchPlaceholder:"Name, year, keywords",
            info:"_TOTAL_ storms",
            infoFiltered: " of _MAX_ total",
            infoEmpty: "_TOTAL_ storms"
        },
        //select:true,
        pagingType:'simple',
        data: preTableData,
        order: [[ 1, "desc" ]],
        responsive:true,
        autoWidth: false,
        columns:[
            {data: 'NAME', orderable:false},
            {data: 'YEAR'},
            {data: 'SCDATES', width:"12%", orderable:false},
            {data: 'SCCAT'},
            {data: 'LANDFALL', orderable:false},
            {data: 'COMMENTS', orderable:false}
        ],
        //rowId:'KEY',
        pageLength:25,
        dom: "<'#p-search.row'<'col-sm-8'f><'col-sm-4'i>>t<'row'<'col-sm-3'l><'col-sm-4'p>>"
    });
};


//load data table data from REST service
//QUERY POST STORMS
var postQuery = L.esri.query({
    url:data
}).returnGeometry(false);

postQuery.run(function(error,fc,response){   
    for (var i = 0; i < fc.features.length; i++){
        tableData.push({
            //"KEY":feature.properties.stormkey,
            "NAME":fc.features[i].properties.stormname,
            "YEAR":fc.features[i].properties.stormyear,
            "MAXCAT":fc.features[i].properties.status+" "+checkForNull(fc.features[i].properties.hurcat),
            "MINPRES":fc.features[i].properties.minpres,
            "MAXWIND":fc.features[i].properties.maxwind,
            "SCDATES":checkDateNull(fc.features[i].properties.scstartdate) + " - " + checkDateNull(fc.features[i].properties.scenddate),
            "SCCAT":fc.features[i].properties.scstatus+" "+checkForNull(fc.features[i].properties.schurcat),            
            "COMMENTS":fc.features[i].properties.comments

        })
    }
    makeStormTable()
});

//load data table data from REST service
//QUERY POST STORMS
var preQuery = L.esri.query({
    url:predata
}).returnGeometry(false);

preQuery.run(function(error,fc,response){   
    console.log(fc)
    for (var i = 0; i < fc.features.length; i++){
        preTableData.push({
            //"KEY":feature.properties.stormkey,
            "NAME":fc.features[i].properties.stormkey,
            "YEAR":fc.features[i].properties.stormyear,
            "SCDATES":checkDateNull(fc.features[i].properties.scstarddate) + " - " + checkDateNull(fc.features[i].properties.scenddate),
            "SCCAT":fc.features[i].properties.status,
            "LANDFALL":fc.features[i].properties.landfalls,
            "COMMENTS":fc.features[i].properties.comments

        })
    }
    makePreTable()
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
})