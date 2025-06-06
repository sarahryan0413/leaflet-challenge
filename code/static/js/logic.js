//--------------------------------------------------------------
// 1. Create Initial Map
//--------------------------------------------------------------

// Create the 'basemap' tile layer that will be the background of our map.
let basemap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});      // topographic view → more geographic context (nice for earthquakes).

// Create the 'street' tile layer as a second background of the map
let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});      // street map standard view → clean, familiar base.

// Create the map object with center and zoom options.
let myMap = L.map("map", {
  center: [44.977753, -93.265015],    // initializes the map centered on Minneapolis, MN
  zoom: 4,                            // set the zoom level so that the entire US is shown
  layers: [basemap]                   // default layer is set to "basemap"
});

// Define baseMaps to toggle between street and topography map views.
let baseMaps = {
  Street: street,
  Topography: basemap
};

// Add layer control to the map.
L.control.layers(baseMaps).addTo(myMap);


//--------------------------------------------------------------
// 2. Add Earthquake Data
//--------------------------------------------------------------

// This function returns the style data for each of the earthquakes we plot on the map. 
  // Pass the magnitude and depth of the earthquake into two separate functions to calculate the color and radius.
  function styleInfo(feature) {
    return {
      fillColor: getColor(feature.geometry.coordinates[2]),   // depth
      radius: getRadius(feature.properties.mag),              // magnitude
      color: "#000000",    // black outline
      weight: 0.5,         // thin border (50%)
      fillOpacity: 0.8,    // 80% opacity for the fill, making it slightly transparent
      opacity: 1           // no transparency for the entire marker (both border and fill)
    }
  }

// This function determines the color of the marker based on the depth of the earthquake.
  function getColor(depth) {
    if (depth < 10) 
      return "#00FF00";      // light green for shallow (0-10 km)
    else if (depth < 30) 
      return "#FFFF00";      // yellow for medium (10-30 km)
    else if (depth < 50) 
      return "#FFA500";      // orange for deep (30-50 km)
    else if (depth < 70)
      return "#FF7F00";      // orange for deeper (50-70 km)
    else if (depth < 90)
      return "#FF4500";      // orange-red for very deep (70-90 km)
    else return "#8B0000";   // red for extremely deep (90+ km)
  }

  // This function determines the radius of the earthquake marker based on its magnitude.
  function getRadius(magnitude) {
    return magnitude * 4;    // multiply by 4 to make the radius larger
  }

// Make a request that retrieves the earthquake geoJSON data.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {

  // Add a GeoJSON layer to the map once the file is loaded.
  L.geoJson(data, {

    // Turn each feature into a circleMarker on the map.
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);   // creates a circle marker at the lat/lng coordinates
    },

    // Set the style for each circleMarker using our styleInfo function.
    style: styleInfo,

    // Create a popup for each marker to display the magnitude and location of the earthquake after the marker has been created and styled
    onEachFeature: function (feature, layer) {
      layer.bindPopup("<h3>" + feature.properties.title +                         // title as header
                      "</h3><hr><p>Magnitude: " + feature.properties.mag +        // magnitude
                      "</p><p>Location: " + feature.properties.place + "</p>")    // location
    }

  // Add the data to the earthquake layer instead of directly to the map.
  }).addTo(myMap);
});


//--------------------------------------------------------------
// 3. Add Tectonic Plate Data
//--------------------------------------------------------------

// Tectonic plates style options
const tectonicStyle = {
  color: "#FF6347",      // tectonic plates color (tomato red)
  weight: 1.5,           // line thickness
  opacity: 1,            // full opacity
  dashArray: "5,5"       // dotted line style for the plates
};

// Add the tectonic plate data.
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plate_data) {

  // Add the tectonic plates GeoJSON data to the map
  L.geoJson(plate_data, {
    style: tectonicStyle   // apply the style to the lines
  }).addTo(myMap);
});


//--------------------------------------------------------------
// 4. Add Legend
//--------------------------------------------------------------

// Create a legend control object.
let legend = L.control({position: "bottomright"});

// Then add all the details for the legend
legend.onAdd = function () {
  let div = L.DomUtil.create("div", "info legend");

  // Initialize depth intervals and colors for the legend
  const depthIntervals = [0, 10, 30, 50, 70, 90];  
  const colors = ["#00FF00", "#FFFF00", "#FFA500", "#FF7F00", "#FF4500", "#8B0000"];
  let labels = [];

  // Loop through intervals to create a color box next to each depth range
  for (let i = 0; i < depthIntervals.length; i++) {
    labels.push("<div style='background-color: " + colors[i] + "; height: 20px; width: 20px; display: block; margin-bottom: 5px;'></div>" + 
                depthIntervals[i] + (depthIntervals[i + 1] ? "&ndash;" + depthIntervals[i + 1] + " km" : "+ km"));
  }

  // Add the depth range labels with colored squares to the legend
  div.innerHTML = "<div style='background-color: rgba(255, 255, 255, 0.7); padding: 10px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);'>" +
                  labels.join("") + 
                  "</div>";
  return div;
};

// Add the legend to the map
legend.addTo(myMap);
