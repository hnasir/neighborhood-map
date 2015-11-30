// For accessing Foursquare API services
var foursquareApi = {
  // Foursquare authentication info
  clientId: 'NYVAAV0OLNG5R4B1ZB3EU1UHINJRERWB3L3MXQWSEAPP3YMR',
  clientSecret: 'HM2QYKDNVFRD0ZEFENGLSM25UDMBCQTVZNXNZKPBU0QHLG0C',

  // Function to retrieve tips from a specific coffee venue based on Foursquare venueId
  getFourSquareTips: function (venueId, callback) {
    // Get today's year, month and date in YYYY, MM and DD formats respectively
    var dateObj = new Date();
    var thisYear = dateObj.getFullYear();
    var thisMonth = dateObj.getMonth();
    var thisDate = dateObj.getDate();
    if (thisMonth < 9) {
      thisMonth = '0' + (thisMonth + 1);
    } else {
      thisMonth = thisMonth + 1;
    }
    if (thisDate < 9) {
      thisDate = '0' + thisDate;
    }

    // Construct url to retrieve venue and include required Foursquare credential info
    var apiURL = 'https://api.foursquare.com/v2/venues/';
    var apiURLCredentials = '/tips?client_id=' + foursquareApi.clientId + '&client_secret=' + foursquareApi.clientSecret + '&v=' + thisYear + thisMonth + thisDate;
    var apiURLFull = apiURL + venueId + apiURLCredentials

    // Prepare ajax call settings
    var settings = {
      url: apiURLFull,
      type: 'GET',
      success: function(responseText) {
        // Send result back to callback function to retrieve data
        callback(responseText);
      },
      fail: function(xhr, status, error) {
        // Log error message to console and return false to callback function to indicate failed request
        console.log("An AJAX error occured: " + status + "\nError: " + error + "\nError detail: " + xhr.responseText);
        callback(false);
      },
      error: function() {
        // return false to callback function to indicate error reply for request
        callback(false);
      }
    }
    // trigger ajax call to Foursquare's API based on above settings
    $.ajax(settings);
  }
}

// For accessing Yelp API services
var yelpApi = {

  // Function to retrieve business information from Yelp API using Yelp's business id
  // Code referenced from http://stackoverflow.com/questions/29152676/yelp-api-oauth-invalid-signature-expected-signature-base-string
  getPlaceInfo: function(yelpBusinessId, callback) {
    // To generate randome nonce value to be used in oauth signing
    function nonce_generate() {
      return (Math.floor(Math.random() * 1e12).toString());
    }

    // Yelp credential information required for authentication
    var consumerSecret = 'RoHXlKWFjIIqJHEd24rFHalsMuA';
    var tokenSecret = 'Lgf_nZCeozt93mqd6w1UPDiq5Dw';

    // Form url we are using for the request with appended Yelp business id
    var apiURL = 'https://api.yelp.com/v2/business/' + yelpBusinessId;

    // Set required parameters for oauth signing
    var parameters = {
      oauth_consumer_key: 'tn3U3Qf4qg_rwnKoBcGbHQ',
      oauth_token: 'rXgbJN6vVJIjwceED8M0Uz26IB5p_JFl',
      oauth_nonce: nonce_generate(),
      oauth_timestamp: Math.floor(Date.now()/1000),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version: '1.0',
      callback: 'cb'
    };


    // Call Yelp's Oauth 1.0a server and generate signature to be used for subsequent request calls
    // Generate function utilizes Marco Bettiolo's JavaScript OAuth library (https://github.com/bettiolo/oauth-signature-js)
    // Note: This signature is only good for 300 seconds after the oauth_timestamp
    var signature = oauthSignature.generate('GET', apiURL, parameters, consumerSecret, tokenSecret, {encodeSignature: true});

    // Add the signature to the list of parameters */
    parameters.oauth_signature = signature;

    // Remove callback parameter added earlier to generate oauth signature as another callback will
    // automatically be appended by jQuery's AJAX library during request call for data
    delete parameters.callback;
    // Prepare ajax call settings
    var settings = {
      url: apiURL,
      data: parameters,
      cache: true,     // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
      dataType: 'jsonp',
      jsonpCallback: 'cb',
      success: function(yelpResults) {
        // Send result back to callback function to retrieve data
        callback(yelpResults)
      },
      fail: function(xhr, status, error) {
        // Log error message to console and return false to callback function to indicate failed request
        console.log("An AJAX error occured: " + status + "\nError: " + error + "\nError detail: " + xhr.responseText);
        callback(false);
      },
      error: function() {
        // Return false to callback function to indicate error reply for request
        callback(false);
      }
    };
    // Trigger AJAX call to Yelp's API service based on above settings
    $.ajax(settings);
  }
}
// Create object for accessing Firebase DB using Firebase's Javascript API
var firebaseDBAccessObj = new Firebase("https://coffeenotes.firebaseio.com/places");

// Model object is used for accessing and searching Coffee Places retrieved from database
var model = {

  dbAuthData: null,
  places: [],
  // Function to connect and authenticate to Firebase DB
  authenticateDB: function() {
    firebaseDBAccessObj.authWithPassword({
      email: "testuser@coffeenotes.com",
      password: "pass123"
    }, function(error, authData) {
      if (error) {
        console.log("Firebase DB Login Failed!", error);
      } else {
        dbAuthData = authData;
      }
    });    
  },
  // Function to retrieve list of coffee places from database
  getPlacesFromDB: function(map, parent) {
    firebaseDBAccessObj.on("value", function(snapshot) {
      var mapPlaces = [];
      model.places = snapshot.val();
      // loop through each place and create array of new Google Map locations
      for (i=0; i < model.places.length; i++) {
        place = model.places[i];
        mapPlaces.push(new MapLocations(place, map, parent));
      }
      // save the array of Google Map locations as a knockoutJS observable array into parent object
      parent.locations = ko.observableArray(mapPlaces);

    }, function(errorObj) {
      // log database connection error details to console
      console.log("Error retrieving data from firebase DB: " + errorObj.code);
      console.log('Reference authentication error id: ' + dbAuthData.uid);
    });
  },
  // Function to search coffee places based on search text and result is returned as array of indexes
  getSearchIndex: function(txt) {
    var foundIn = [];
    // loop through each coffee place and store it's place array index into result array
    // if search text is found in the name, address or city text of the coffee place
    for (i = 0; i < model.places.length; i++) {
      if (model.places[i].name.toLowerCase().indexOf(txt.toLowerCase()) > -1) {
        foundIn.push(i);
      } else if (model.places[i].address.toLowerCase().indexOf(txt.toLowerCase()) > -1) {
        foundIn.push(i);
      } else if (model.places[i].city.toLowerCase().indexOf(txt.toLowerCase()) > -1) {
        foundIn.push(i);
      } 
    }
    return foundIn;
  }
}

// Function to create map location objects for each coffee place
function MapLocations(place, map, parent) {
  // initialise location variables utilizing KnockoutJS's observable object where required
  var self = this;
  self.place = ko.observable(place);
  self.parent = parent;
  self.isShown = ko.observable(false);
  self.isSelected = ko.observable(false);
  self.mapWindow = ko.observable(null);
  self.yelpInfo = ko.observable(false);

  var marker;
  // Create new marker for google maps with corresponding location name
  marker = new google.maps.Marker({
    position: new google.maps.LatLng(place.coordinate.latitude, place.coordinate.longitude),
    animation: google.maps.Animation.DROP,
    title: place.name,
    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
  });

  self.marker = marker;
  // Function to manage display of marker when isShown is set as true or false
  self.isShown.subscribe(function(currentState) {
    // add marker to map if isShown is true, else remove from map by setting it to null
    if(currentState) {
      marker.setMap(map);
    } else {
      marker.setMap(null);
    }
  });
  // Function to manage behavior when a particular coffee place marker is selected
  self.isSelected.subscribe(function(currentState) {
    // If isSelected for location is set to true
    if (currentState) {
      // Change colour of selected place marker to green
      marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
      // Set itself as the current selected location in parent LocationViewModel object
      self.parent.selectedLoc(self);
      // Animate the marker on google map to draw user's attention
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){ 
        marker.setAnimation(null); 
      }, 750);
      // Format infowindow html code for display based on place details
      var infoWindow = new google.maps.InfoWindow({
        content: '<div class="LocationInfo"><strong>'+self.place().name+'</strong>'+
                 '<p>'+self.place().address+ ', '+ self.place().city + ', Victoria ' + self.place().postal+'</p>'+
                 '<p>Contact no: <span id="contact"></span><br/>'+
                 'Yelp rating: <img id="ratingimg">&nbsp;(<span id="rating"></span>)<br/>'+
                 '<a href="#" id="reviews">View Yelp reviews</a><br/><br/>'+ 
                 'Latest Foursquare tip: <i><a href="#" id="tips"></a></i>'+ 
                 '</p></div>'
      });
      // open above infowindow in Google Map for current place's marker 
      infoWindow.open(map, self.marker);
      self.mapWindow(infoWindow);
      // call Yelp API to retrieve additional place details based on associated Yelp ID
      yelpApi.getPlaceInfo(self.place()['yelp-id'], function(yelpResult) {
        // Callback function to display additional details and ratings or
        // relavent message if not available
        if (yelpResult != false) {
          $('#contact').html(yelpResult.display_phone ? yelpResult.display_phone : 'n/a');
          $('#ratingimg').attr('src', yelpResult.rating_img_url_small ? yelpResult.rating_img_url_small : 'n/a');
          $('#rating').html(yelpResult.rating ? yelpResult.rating : '-');
          $('#reviews').attr('href', yelpResult.url ? yelpResult.url : '#');
        } else {
          $('#contact').html('n/a');
          $('#rating').html(yelpResult.rating ? yelpResult.rating : '-');
          $('#reviews').html('<i>Yelp data service request failed.</i>');
        }
      });
      // call Foursquare API to retrieve additional place details based on associated Foursquare venue ID
      foursquareApi.getFourSquareTips(self.place()['foursquare-id'], function(tipResults) {
        // Callback function to display Foursquare tip with relavent message shown if not available     
        if (tipResults != false) {
          if (tipResults.response.tips.count >= 1) {
            // update tip text by taking first tip if no of tips >= 1
            $('#tips').html(tipResults.response.tips.items[0].text);
          } else {
            // no tips found for location
            $('#tips').html('n/a');    
          }
        } else {
          // foursquare data access had failed
          $('#tips').html('Foursquare data service request failed.');    
        }
      });

    } else {
      // change Google Map marker back to red and close infowindow if isSelected is set to false
      self.parent.selectedLoc().marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
      if (self.mapWindow() !== null) { 
        self.mapWindow().close();
      }
    }
  });
  // set location's isShown property to true when first created
  self.isShown(true);
  // add listener to Google Map marker to trigger function upon clicking
  marker.addListener('click', function() {
    // set marker animation to stop if there is still animation on going
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      // check if there is any currently selected coffee place location
      if (self.parent.selectedLoc() != null) {
        // check that user is not clicking on a location marker that is already selected
        if (self.parent.selectedLoc() != self) {
          // set existing selected marker to false and set newly clicked marker as selected
          self.parent.selectedLoc().isSelected(false);
          self.isSelected(true);
        }
      } else {
        // set newly clicked marker as selected
        self.isSelected(true);
      }
    }
  });
}


// ViewModel function for location related elements
function LocationViewModel() {
  // Initialise variables using KnockoutJS observable objects
  var self = this;
  self.selectedLoc = ko.observable(null);
  self.searchText = ko.observable('');
  self.locations = ko.observableArray(null);
  // Perform DB authentication and load list of coffee places retrieved from DB into locations variable
  model.authenticateDB();
  model.getPlacesFromDB(map, self);
  // Function to update currently selected location based on location object input
  self.selectLocation = function (location) {
    if (self.selectedLoc() != null) {
      self.selectedLoc().isSelected(false);
    }
    location.isSelected(true);
  }
  // Function to set all locations' isShown property to false
  self.hideAllLocations = function () {
    for (i = 0; i < self.locations().length; i++) {
      self.locations()[i].isShown(false);
    }
  }
  // Function to set all locations' isShown property to true
  self.showAllLocations = function () {
    for (i = 0; i < self.locations().length; i++) {
      self.locations()[i].isShown(true);
    }
  }
  // Function to trigger search function when search text is updated
  self.searchText.subscribe(function() {
    // Check that search text is not empty
    if (self.searchText().length > 0) {
      // hide all location markers
      self.hideAllLocations();
      // get result array of location indexes with matching text
      var resultIndex = model.getSearchIndex(self.searchText());
      // set isShown property of locations in result array to true 
      for (i = 0; i < resultIndex.length; i++) {
        self.locations()[resultIndex[i]].isShown(true);
      }
    } else {
      // show all location markers if search text is empty
      self.showAllLocations();
    }
  });

}

var map;
// Function to initialize google map and apply view model binding for KnockoutJS object
function initializeMap() {
  // set appropriate starting location and zoom depth for Google Map
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -37.8135529, lng: 144.9621429},
    zoom: 14
  });

  var locationVM = new LocationViewModel()
  // apply binding for LocationViewModel after some delay to allow google map loading to complete
  setTimeout(function() {
    ko.applyBindings(locationVM);
  }, 2000);
}
// Add listener to trigger the initializeMap function when window is loaded
google.maps.event.addDomListener(window, 'load', initializeMap);

// Add function to toggle open-sidebar class when hamburger menu is clicked using jQuery
$(document).ready(function() {
  $("[data-toggle]").click(function() {
    var toggle_element = $(this).data("toggle");
    $(toggle_element).toggleClass("open-sidebar");
  });
});


