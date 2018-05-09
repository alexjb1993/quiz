// Javascript for the data and fucntions for the mobile app

// Adapted from: https://github.com/claireellul/cegeg077-week5app/blob/master/ucfscde/www/js/appActivity.js

var mymap = L.map('mapid').fitWorld();

// load the map tiles
L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw", {
attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
maxZoom: 18,
id: 'mapbox.streets'
}).addTo(mymap);

// set veiw extent to London
mymap.setView([51.499, -0.10], 13);

// Create coloured markers
var MarkerDBlue = L.AwesomeMarkers.icon({
	markerColor: 'darkblue'
});

var MarkerPurple = L.AwesomeMarkers.icon({
	markerColor: 'purple'
	});

var MarkerGreen = L.AwesomeMarkers.icon({
	markerColor: 'green'
	});

// Create variable to hold the XMLHttpRequest()
var reqXML;

// Create a variable to hold the questions
var questGeoJSON;

// Call the question data through the server using XMLHttpRequest
function questGet() {
		reqXML = new XMLHttpRequest();
		reqXML.open('GET','http://developer.cege.ucl.ac.uk:30285/questGet');
		reqXML.onreadystatechange = questReturn;
		reqXML.send();
}

// Get response from data server, then process it
function questReturn() {
// Wait until data is ready
		if (reqXML.readyState == 4) {
		// Process the data
var questData = reqXML.responseText;

questLoad(questData);
}
}

// Add the question data from the database to the map
function questLoad(questData) {
// Convert the WKT to JSON
var questJSON = JSON.parse(questData);
// Load as a geoJSON layer
var questGeoJSON = L.geoJson(questJSON,
{
// Create a point layer from latitude and longitude values
pointToLayer: function (feature, latlng)
{
//Create a marker for each question in the database
questMarker = L.marker(latlng, {icon:MarkerPurple})
// popup the location descrpition on question marker click
questMarker.bindPopup("<b>"+feature.properties.locationdesc +"</b>");

//Put the markers to the questMarks array
questMarks.push(questMarker);

// Add the question markers to the map
return questMarker;
},
}).addTo(mymap);

// set map extent to show all points
mymap.fitBounds(questGeoJSON.getBounds());
}

// Track user location
// Adapted from: https://gis.stackexchange.com/questions/182068/getting-current-user-location-automatically-every-x-seconds-to-put-on-leaflet
//							 https://stackoverflow.com/questions/48651799/how-do-i-simply-get-the-current-geolocation-using-leaflet-without-events
// Set location tracker variables
var trackUser = true;
var locUser;
var locUserRad;
var panUser = false;

// Create th e locatoin tracker function
function locTrack() {
		if (!trackUser){
// If location is not found zoom to map extent
mymap.fitBounds(locUser.getLatLng().toBounds(250));
panUser = true;
} else {
// Alert if locatoin services are available
		if (navigator.geolocation) {
		alert("Finding your location");
		navigator.geolocation.watchPosition(showposition);
		//Alert if location services are not available
		} else {
		alert("Your device does not have location services enabled ");
}
}
}

// Create show position function
function showposition(position) {
// check if tracking has occured and put a marker and radius around them
		if(!trackUser){
			mymap.removeLayer(locUser);
			mymap.removeLayer(locUserRad);
		}
// create a 30m radius around the marker
var radius = 30;
// Define the user location as a coloured marker
locUser = L.marker([position.coords.latitude,position.coords.longitude], {icon:MarkerDBlue}).addTo(mymap);
locUserRad = L.circle([position.coords.latitude,position.coords.longitude], radius).addTo(mymap);
// If location is not found zoom to map extent
		if(trackUser){
			trackUser = false;
			mymap.fitBounds(locUser.getLatLng().toBounds(250));
			panUser = true;
// If location is found pan to it
		}else if (panUser) {
			mymap.panTo(locUser.getLatLng());
}
}

// Function to find distance between user and a question point
// Create function to convert degrees to rads
function radConvert(deg) {
return deg * (Math.PI/180)
}
// Use the haversine formula to find distance in meters between the user question points : https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function distUserQuest(userLat,userLon,questLat,questLon) {
// Earth radius in km
var distLon = radConvert(questLon-userLon);
var distLat = radConvert(questLat-userLat);
var R = 6371;
var x =
		Math.sin(distLat/2) * Math.sin(distLat/2) +
		Math.cos(radConvert(userLat)) * Math.cos(radConvert(questLat)) *
		Math.sin(distLon/2) * Math.sin(distLon/2)
;
var z = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
var dst = R * z;
var dstm = dst * 1000;
return dstm;
}

questMarks = [];

// Function to show answerable questions
function questSelect(){
distUser2Quest(questMarks);
}

// Determine distance between user and all question markers
function distUser2Quest(questMarkers){
// Find users current location
latlng = locUser.getLatLng();
alert("Finding questions within range");
// Show all questions within 30m of the user
for(var i=0; i<questMarkers.length; i++) {
questInRange = questMarkers[i];
questInRangeGeom = questInRange.getLatLng();
var userInRange = distUserQuest(questInRangeGeom.lat, questInRangeGeom.lng, latlng.lat, latlng.lng);
// If user is within 30m of a marker, trun it blue and prompt answering
		if (userInRange <= 20) {
			questMarkers[i].setIcon(MarkerGreen);
			questMarkers[i].on('click', userClick);
		// If user is not within range th e marker stays the same
		} else {
			questMarkers[i].setIcon(MarkerPurple);
			questMarkers[i].bindPopup("You are too far away");
  }
}
}

// Create a variable for the active question marker
var activeMarker;

// On click open active question page
function userClick(e) {
questShowActive(this);
activeMarker = this;
}

// Create function for active question page
function questShowActive(questActive) {

// Open active question page in the map window
document.getElementById('ActiveQuestion').style.display = 'block';
document.getElementById('mapid').style.display = 'none';
// Retrieve the question data
document.getElementById("question").value = questActive.feature.properties.question;
document.getElementById("answera").value = questActive.feature.properties.answera;
document.getElementById("answerb").value = questActive.feature.properties.answerb;
document.getElementById("answerc").value = questActive.feature.properties.answerc;
document.getElementById("answerd").value = questActive.feature.properties.answerd;
// create check boxes for the answers
document.getElementById("radA").checked = false;
document.getElementById("radB").checked = false;
document.getElementById("radC").checked = false;
document.getElementById("radD").checked = false;
activeMarker = questActive;
}

// On answer submit, return an error if an answer is not selected
function sendData() {
var ar=document.getElementById("radA").checked;
var br=document.getElementById("radB").checked;
var cr=document.getElementById("radC").checked;
var dr=document.getElementById("radD").checked;
  if (ar==false && br==false && cr==false && dr==false)
  {
      alert("Choose your answer");
return false;
  }
// if an answer is selected, upload it to the database
  else
  {
  	ansUploadData()
  }
}

// Create a variable to store true answer selections in
var ansCorrectChoice;

function ansUploadData() {
alert ("answer saved");
// Get the correct answer to the question from the question table
var anscorrect = activeMarker.feature.properties.answercorrect;
// Get the question text
var question = document.getElementById("question").value;
// Create an answer variable
var answer;
// Create string variable to upload data to tthe database
var postString = "question="+question;
// Get radio button values from the active question page
		if (document.getElementById("radA").checked) {
		answer = 1;
		  postString=postString+"&answer="+answer;
		}
		if (document.getElementById("radB").checked) {
		answer = 2;
		postString=postString+"&answer="+answer;
		}
		if (document.getElementById("radC").checked) {
		answer =3;
		postString=postString+"&answer="+answer;
		}
		if (document.getElementById("radD").checked) {
		answer =4;
		postString=postString+"&answer="+answer;
		}
		// alert the user if they have answered correctly
		if (answer == anscorrect) {
		alert("Correct! \n Well Done");
		ansCorrectChoice = true;
		// If they answer incorrectly, tell them the correct answer
		} else {
		alert("Sorry that answer is WRONG! \n Try Again ");
		ansCorrectChoice = false;
		}
// add the correct answer to the upload string
postString = postString + "&anscorrect="+anscorrect;
ansProcess(postString);
}

// Create variable to hold the XMLHttpRequest()
var reqXML;

// Upload the answer data through the server using XMLHttpRequest
function ansProcess(postString) {
	reqXML = new XMLHttpRequest();
	reqXML.open('POST','http://developer.cege.ucl.ac.uk:30285/ansUpload',true);
	reqXML.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	reqXML.onreadystatechange = ansUpload;
	reqXML.send(postString);
}

// Upload to data server and check response
function ansUpload() {
// Wait until data is ready
	if (reqXML.readyState == 4) {
// Exit the active question page and return to the leaflet map
document.getElementById('ActiveQuestion').style.display = 'none';
document.getElementById('mapid').style.display = 'block';
}
}
