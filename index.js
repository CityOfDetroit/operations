var mapboxgl = require('mapbox-gl');
var WKT = require('terraformer-wkt-parser');
var arcgis = require('terraformer-arcgis-parser');
var simplify = require('simplify-geojson')
var bbox = require('@turf/bbox')

// this is random but probably fits 768px height
document.getElementById('map').style.height = `${window.innerHeight - 70}px`;

mapboxgl.accessToken = 'pk.eyJ1IjoiY2l0eW9mZGV0cm9pdCIsImEiOiJjaXZvOWhnM3QwMTQzMnRtdWhyYnk5dTFyIn0.FZMFi0-hvA60KYnI-KivWg';

// make a map objects
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/cityofdetroit/cj13qtu65000p2rppshw19c8t',
    doubleClickZoom: false,
    zoom: 10.35,
    center: [-83.111, 42.350],
    // :triangular_ruler:
    bearing: -1.25,
    minZoom: 9,
    maxBounds: [
        [-83.611, 42.100],
        [-82.511, 42.600]
    ]
});

// census tracts are the boundary
var boundary = "neighborhoods"
// store currently selected geometry here
var geom = null;
var simplified = null;

// the map is ready
map.on('load', function() {

  // add boundary source
  map.addSource(boundary, {
    "type": 'geojson',
    "data": "https://gis.detroitmi.gov/arcgis/rest/services/Boundaries/Neighborhoods/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&geometryPrecision=5&f=geojson"
  });

  // add line & fill layer
  map.addLayer({
    "id": boundary + "_line",
    "type": "line",
    "source": boundary,
    "layout": {
      "visibility": "visible",
      "line-join": "round"
    },
    "paint": {
        "line-color": "#189aca",
        "line-opacity": {
            stops: [
                [8, 1],
                [11, 0.5],
                [16, 0.05],
                [18, 0.01]
            ]
        },
        "line-width": {
            stops: [
                [8, 0.1],
                [11, 1.5],
                [13, 5],
                [22, 18]
            ]
        }
    }
  });

  // we could probably remove this layer
  map.addLayer({
    "id": boundary + "_selected",
    "type": "line",
    "source": boundary,
    "filter": ["==", "slug", "none"],
    "layout": {
      "visibility": "visible",
      "line-join": "round"
    },
    "paint": {
        "line-color": "green",
        "line-opacity": {
            stops: [
                [8, 1],
                [11, 0.75],
                [16, 0.2],
                [22, 0.01]
            ]
        },
        "line-width": {
            stops: [
                [8, 0.1],
                [11, 1.5],
                [13, 5],
                [22, 18]
            ]
        }
    }
  });

  // this fill could be invisible - but it needs to exist so click events hit it
  map.addLayer({
    "id": boundary + "_fill",
    "type": "fill",
    "source": boundary,
    "layout": {
        "visibility": "visible",
    },
    "paint": {
        "fill-color": "#fff",
        "fill-opacity": {
            stops: [
                [8, 0.2],
                [11, 0.1],
                [17, 0.01]
            ]
        }
    }
  });

  map.addSource('marygrove', {
    type: 'geojson',
    data: './marygrove.geojson'
  })
  map.addLayer({
      "id": "marygrove-line",
      "type": "line",
      "source": "marygrove",
      "layout": {
        "visibility": "visible",
      },
      "paint": {
        "line-color": "rgba(0,0,0,0.25)",
        "line-width": 0.2
      }
  });
  map.addLayer({
      "id": "marygrove-inter1",
      "type": "fill",
      "source": "marygrove",
      "filter": ["<=", "dlbaOccupancyModel", 65],
      "layout": {
        "visibility": "visible",
      },
      "paint": {
        "fill-color": "yellow",
        "fill-opacity": 0.4
      }
  });
  map.addLayer({
      "id": "marygrove-inter2",
      "type": "fill",
      "source": "marygrove",
      "filter": [">=", "dlbaBlightModel", 35],
      "layout": {
        "visibility": "visible",
      },
      "paint": {
        "fill-color": "red",
        "fill-opacity": 0.4
      }
  });

  // add the sources and layers for the overlay data. DRY
  map.addSource('permits', {
      type: 'geojson',
      tolerance: 0,
      data: "https://gis.detroitmi.gov/arcgis/rest/services/DoIT/Permits/MapServer/0/query?where=1%3D0&f=geojson"
  });
  map.addLayer({
      "id": "permits",
      "type": "symbol",
      "source": "permits",
      "layout": {
        "visibility": "none",
        "icon-image": "building-15",
        "icon-ignore-placement": true,
        "icon-padding": 0
      }
  });


  map.addSource('demolitions', {
      type: 'geojson',
      tolerance: 0,
      data: "https://data.detroitmi.gov/resource/uzpg-2pfj.geojson?$where=1=0"
  });
  map.addLayer({
      "id": "demolitions",
      "type": "symbol",
      "source": "demolitions",
      "layout": {
        "visibility": "none",
        "icon-image": "cross-15",
        "icon-ignore-placement": true,
        "icon-padding": 0
      }
  });

  map.addSource('scf', {
      type: 'geojson',
      tolerance: 0,
      data: "https://data.detroitmi.gov/resource/j7tb-epek.geojson?$where=1=0"
  });
  map.addLayer({
      "id": "scf",
      "type": "symbol",
      "source": "scf",
      "layout": {
        "visibility": "none",
        "icon-image": "information-15",
        "icon-ignore-placement": true,
        "icon-padding": 0
      }
  });

  map.addSource('bizcert', {
      type: 'geojson',
      tolerance: 0,
      data: "https://data.detroitmi.gov/resource/mnsu-xtwj.geojson?$where=1=0"
  });
  map.addLayer({
      "id": "bizcert",
      "type": "symbol",
      "source": "bizcert",
      "layout": {
        "visibility": "none",
        "icon-image": "suitcase-15",
        "icon-ignore-placement": true,
        "icon-padding": 0
      }
  });

  map.addSource('blight', {
      type: 'geojson',
      tolerance: 0,
      data: "https://data.detroitmi.gov/resource/nk39-txdi.geojson?$where=1=0"
  });
  map.addLayer({
      "id": "blight",
      "type": "symbol",
      "source": "blight",
      "layout": {
        "visibility": "none",
        "icon-image": "waste-basket-15",
        "icon-ignore-placement": true,
        "icon-padding": 0
      }
  });

  map.addSource('mcmatch', {
      type: 'geojson',
      tolerance: 0,
      data: "https://data.detroitmi.gov/resource/pyyy-gxn4.geojson?$where=1=0"
  });
  map.addLayer({
      "id": "mcmatch",
      "type": "symbol",
      "source": "mcmatch",
      "layout": {
        "visibility": "none",
        "icon-image": "bank-15",
        "icon-ignore-placement": true,
        "icon-padding": 0
      }
  });

  map.addSource('crime', {
      type: 'geojson',
      tolerance: 0,
      data: "https://data.detroitmi.gov/resource/i9ph-uyrp.geojson?$where=1=0"
  });
  map.addLayer({
      "id": "crime",
      "type": "symbol",
      "source": "crime",
      "layout": {
        "visibility": "none",
        "icon-image": "fire-station-15",
        "icon-ignore-placement": true,
        "icon-padding": 0
      }
  });

});

// click on a tract - get census api info
map.on('dblclick', function(e){
  console.log(e)
  var features = map.queryRenderedFeatures(e.point, {
      "layers": [boundary + '_fill']
  });

  console.log(features);

  //
  // map.easeTo({
  //   center: e.lngLat,
  //   zoom: 14
  // });

  // highlight the selected geometry. there's a better way to do this
  map.setFilter(boundary + '_selected', ['==', 'slug'].concat(features[0]['properties']['slug']));

  // get a simplified geometry that we can GET from ArcGIS Server
  geom = features[0]
  simplified = simplify(geom, 0.0005)
  map.fitBounds(bbox(simplified), {'padding':100});

  // check on demos and permits
  updatePermits(e);
  updateDemos(e);
  updateScf(e);
  updateBizcert(e);
  updateBlight(e);
  updateMCMatch(e);
  updateCrime(e);
});

// open a popup on click
map.on('click', function (e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['permits', 'demolitions', 'scf', 'bizcert', 'blight', 'mcmatch', 'crime', 'marygrove-inter1', 'marygrove-inter2'] });

    if (!features.length) {
        return;
    }

    var feature = features[0];
    console.log(feature)

    // is it a demolition?

    switch(feature.layer.id) {
      case "demolitions":
        // ES6 template literal :muscle:
        var html = `
        <span class="b">Address</span> <br/>
        <span class="">${feature.properties.address}</span> <br/>
        <span class="b">Contractor</span> <br/>
        <span class="">${feature.properties.contractor_name}</span><br/>
        <span class="b">Price</span><br/>
        <span class="">$${feature.properties.price}</span><br/>
        <span class="b">Demolition Date</span><br/>
        <span class="">${feature.properties.demolition_date.slice(0,10)}</span>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
        break;
      case "permits":
        var html = `
        <span class="b">Address</span><br/>
        <span class="">${feature.properties.site_address}</span><br/>
        <span class="b">Contractor</span><br/>
        <span class="">${feature.properties.contractor_last_name}</span><br/>
        <span class="b">Estimated Cost</span><br/>
        <span class="">${feature.properties.estimated_cost}</span><br/>
        <span class="b">Type</span><br/>
        <span class="">${feature.properties.bld_permit_type}</span><br/>
        <span class="b">Description</span><br/>
        <span class="">${feature.properties.bld_permit_desc}</span><br/>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
        break;
      case "scf":
        var html = `
        <span class="b">Issue Type</span><br/>
        <span class="">${feature.properties.issue_type}</span><br/>
        <span class="b">Ticket Status</span><br/>
        <span class="">${feature.properties.ticket_status}</span><br/>
        <span class="b">Created At</span><br/>
        <span class="">${feature.properties.ticket_created_date_time}</span><br/>
        <span class="b">Closed At</span><br/>
        <span class="">${feature.properties.ticket_closed_date_time}</span><br/>
        <span class="b">Address</span><br/>
        <span class="">${feature.properties.address}</span><br/>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
        break;
      case "bizcert":
        var html = `
        <span class="b">Business Name</span><br/>
        <span class="">${feature.properties.business_name}</span><br/>
        <span class="b">Street Address</span><br/>
        <span class="">${feature.properties.business_street_address}</span><br/>
        <span class="b">Certification Expiration Date</span><br/>
        <span class="">${feature.properties.certification_expire_date_1_yr_from_end_date_or_prev_cert_date_use_later_date}</span><br/>
        <span class="b">Business Type</span><br/>
        <span class="">${feature.properties.business_type}</span><br/>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
        break;
      case "blight":
        var html = `
        <span class="b">Ticket Number</span><br/>
        <span class="">${feature.properties.ticket_number}</span><br/>
        <span class="b">Violation Code</span><br/>
        <span class="">${feature.properties.violation_code}</span><br/>
        <span class="b">Issuing Agency</span><br/>
        <span class="">${feature.properties.agency_name}</span><br/>
        <span class="b">Ticket Issued Date</span><br/>
        <span class="">${feature.properties.ticket_issued_date}</span><br/>
        <span class="b">Hearing Date</span><br/>
        <span class="">${feature.properties.hearing_date}</span><br/>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
        break;
      case "mcmatch":
        var html = `
        <span class="b">Organization</span><br/>
        <span class="">${feature.properties.mcm_recipi}</span><br/>
        <span class="b">Address</span><br/>
        <span class="">${feature.properties.org_addres}</span><br/>
        <span class="b">Description</span><br/>
        <span class="">${feature.properties.grant_desc}</span><br/>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
        break;
      case "crime":
        var html = `
        <span class="b">Organization</span><br/>
        <span class="">${feature.properties.mcm_recipi}</span><br/>
        <span class="b">Address</span><br/>
        <span class="">${feature.properties.org_addres}</span><br/>
        <span class="b">Description</span><br/>
        <span class="">${feature.properties.grant_desc}</span><br/>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
        break;
      case "marygrove-inter1":
        var html = `
        <span class="b">Address</span><br/>
        <span class="">${feature.properties.dlbaAccountName}</span><br/>
        <span class="b">Blight Model</span><br/>
        <span class="">${feature.properties.dlbaBlightModel}</span><br/>
        <span class="b">Occupancy Model</span><br/>
        <span class="">${feature.properties.dlbaOccupancyModel}</span><br/>
        <span class="b">Current Status</span><br/>
        <span class="">${feature.properties.dlbaCurrentStatus}</span><br/>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map);
        break;
      case "marygrove-inter2":
        var html = `
        <span class="b">Address</span><br/>
        <span class="">${feature.properties.dlbaAccountName}</span><br/>
        <span class="b">Blight Model</span><br/>
        <span class="">${feature.properties.dlbaBlightModel}</span><br/>
        <span class="b">Occupancy Model</span><br/>
        <span class="">${feature.properties.dlbaOccupancyModel}</span><br/>
        <span class="b">Current Status</span><br/>
        <span class="">${feature.properties.dlbaCurrentStatus}</span><br/>
        `
        var popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map);
        break;
    }
});

// indicate that the symbols are clickable by changing the cursor style to 'pointer'.
map.on('mousemove', function (e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['permits', 'demolitions', 'scf', 'bizcert', 'blight', 'mcmatch', 'crime'] });
    map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
});

// when you click the input
document.getElementById("permits").addEventListener("click", function(e){
  updatePermits();
});
document.getElementById("demos").addEventListener("click", function(e){
  updateDemos();
});
document.getElementById("scf").addEventListener("click", function(e){
  updateScf();
});
document.getElementById("bizcert").addEventListener("click", function(e){
  updateBizcert();
});
document.getElementById("blight").addEventListener("click", function(e){
  updateBlight();
});
document.getElementById("mcmatch").addEventListener("click", function(e){
  updateMCMatch();
});
document.getElementById("crime").addEventListener("click", function(e){
  updateCrime();
});

// function to update permits
function updatePermits() {
  // is the element checked or unchecked?
  var permits_box = document.getElementById("permits")

  // it's checked:
  if (permits_box.checked){
    // convert the simple geom to ArcJSON for the intersection parameter
    var polygon = arcgis.convert(simplified.geometry, 0.1, false);

    // make a URL. turn this into an opts => collect and join
    var url = "https://gis.detroitmi.gov/arcgis/rest/services/DoIT/Permits/MapServer/0/query?where=bld_permit_type+not+in+%28%27Dismantle%27%29&text=&objectIds=&time=&geometryType=esriGeometryPolygon&geometry=".concat(encodeURI(JSON.stringify(polygon)),"&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=geojson")
    map.getSource('permits').setData(url);
    map.setLayoutProperty("permits", 'visibility', 'visible');
  }

  // it's unchecked: make it invisible
  else {
     map.setLayoutProperty("permits", 'visibility', 'none');
  }
};

// function to update demolitions
function updateDemos() {
  // is the element checked or unchecked?
  var demos_box = document.getElementById("demos")

  // it's checked:
  if (demos_box.checked){
    // get the simple geometry in WKT and regex the meaningless parts of the coordinates away
    var polygon = WKT.convert(simplified.geometry, 0.1, false).replace(/(\.\d{4})(\d+)/g, "$1");

    // this is janky, but works
    var url = "?$where=within_polygon(location,\'".concat(polygon, "')")
    var fixedurl = "https://data.detroitmi.gov/resource/uzpg-2pfj.geojson".concat(encodeURI(url).replace("')", "%27)"))
    console.log(fixedurl)

    // set a new source for the demo data
    map.getSource('demolitions').setData(fixedurl);
    // make visible
    map.setLayoutProperty("demolitions", 'visibility', 'visible');
  }
  // it's unchecked: make it invisible
  else {
    map.setLayoutProperty("demolitions", 'visibility', 'none');
  }
};

// function to update SCF
function updateScf() {
  // is the element checked or unchecked?
  var scf_box = document.getElementById("scf")

  // it's checked:
  if (scf_box.checked){
    // get the simple geometry in WKT and regex the meaningless parts of the coordinates away
    var polygon = WKT.convert(simplified.geometry, 0.1, false).replace(/(\.\d{4})(\d+)/g, "$1");

    // this is janky, but works
    var url = "?$where=within_polygon(location,\'".concat(polygon, "')")
    var fixedurl = "https://data.detroitmi.gov/resource/j7tb-epek.geojson".concat(encodeURI(url).replace("')", "%27)"))
    console.log(fixedurl)
    // set a new source for the demo data
    map.getSource('scf').setData(fixedurl);
    // make visible
    map.setLayoutProperty("scf", 'visibility', 'visible');
  }
  // it's unchecked: make it invisible
  else {
    map.setLayoutProperty("scf", 'visibility', 'none');
  }
};

// function to update Business Certification Register
function updateBizcert() {
  // is the element checked or unchecked?
  var bizcert_box = document.getElementById("bizcert")

  // it's checked:
  if (bizcert_box.checked){
    // get the simple geometry in WKT and regex the meaningless parts of the coordinates away
    var polygon = WKT.convert(simplified.geometry, 0.1, false).replace(/(\.\d{4})(\d+)/g, "$1");

    // this is janky, but works
    var url = "?$where=within_polygon(physical_address_map,\'".concat(polygon, "')")
    var fixedurl = "https://data.detroitmi.gov/resource/mnsu-xtwj.geojson".concat(encodeURI(url).replace("')", "%27)"))
    console.log(fixedurl)
    // set a new source for the demo data
    map.getSource('bizcert').setData(fixedurl);
    // make visible
    map.setLayoutProperty("bizcert", 'visibility', 'visible');
  }
  // it's unchecked: make it invisible
  else {
    map.setLayoutProperty("bizcert", 'visibility', 'none');
  }
};

// function to update Blight Violations
function updateBlight() {
  // is the element checked or unchecked?
  var blight_box = document.getElementById("blight")

  // it's checked:
  if (blight_box.checked){
    // get the simple geometry in WKT and regex the meaningless parts of the coordinates away
    var polygon = WKT.convert(simplified.geometry, 0.1, false).replace(/(\.\d{4})(\d+)/g, "$1");

    // this is janky, but works
    var url = "?$select=*,date_trunc_y(hearing_date) as year&$where=year='2017' and within_polygon(location,\'".concat(polygon, "')")
    var fixedurl = "https://data.detroitmi.gov/resource/nk39-txdi.geojson".concat(encodeURI(url).replace("')", "%27)"))
    console.log(fixedurl)
    // set a new source for the demo data
    map.getSource('blight').setData(fixedurl);
    // make visible
    map.setLayoutProperty("blight", 'visibility', 'visible');
  }
  // it's unchecked: make it invisible
  else {
    map.setLayoutProperty("blight", 'visibility', 'none');
  }
};

// function to update Blight Violations
function updateCrime() {
  // is the element checked or unchecked?
  var crime_box = document.getElementById("crime")

  // it's checked:
  if (crime_box.checked){
    // get the simple geometry in WKT and regex the meaningless parts of the coordinates away
    var polygon = WKT.convert(simplified.geometry, 0.1, false).replace(/(\.\d{4})(\d+)/g, "$1");

    // this is janky, but works
    var url = "?$select=*,date_trunc_y(incidentdate) as year&$where=year='2016' and category in ('ARSON') and within_polygon(location,\'".concat(polygon, "')")
    var fixedurl = "https://data.detroitmi.gov/resource/i9ph-uyrp.geojson".concat(encodeURI(url).replace("')", "%27)"))
    console.log(fixedurl)
    // set a new source for the demo data
    map.getSource('crime').setData(fixedurl);
    // make visible
    map.setLayoutProperty("crime", 'visibility', 'visible');
  }
  // it's unchecked: make it invisible
  else {
    map.setLayoutProperty("crime", 'visibility', 'none');
  }
};

// function to update Motor City Match
function updateMCMatch() {
  // is the element checked or unchecked?
  var mcmatch_box = document.getElementById("mcmatch")

  // it's checked:
  if (mcmatch_box.checked){
    // convert the simple geom to ArcJSON for the intersection parameter
    var polygon = arcgis.convert(simplified.geometry, 0.1, false);

    // make a URL. turn this into an opts => collect and join
    var url = "https://gis.detroitmi.gov/arcgis/rest/services/DoIT/MotorCityMatch/FeatureServer/0/query?where=&objectIds=&time=&geometryType=esriGeometryPolygon&geometry=".concat(encodeURI(JSON.stringify(polygon)),"&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=geojson")
    map.getSource('mcmatch').setData(url);
    map.setLayoutProperty("mcmatch", 'visibility', 'visible');
  }

  // it's unchecked: make it invisible
  else {
     map.setLayoutProperty("mcmatch", 'visibility', 'none');
  }
};
