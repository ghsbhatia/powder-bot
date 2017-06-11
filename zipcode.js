var request = require('request');
var zipcodeUrlTemplate = 'http://maps.googleapis.com/maps/api/geocode/json?address={city}+CO';
var city = 'aspen';
var zipcodeUrl = zipcodeUrlTemplate.replace('{city}', city);
request(zipcodeUrl, function (error, response, body) {
  var addressComponents = JSON.parse(body).results[0].address_components;
  var zipCode = addressComponents[addressComponents.length-1].short_name;
  console.log('zipcode:', zipCode); 
});
