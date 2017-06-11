var request = require('request');
var weatherUrlTemplate = 'https://api.weather.com/v1/location/{zipcode}:4:US/forecast/daily/3day.json?language=en-US&units=e&apiKey=f43934a981fc48f5926e5929d3ee0760'; 
var zipCode=81657;
var weatherUrl = weatherUrlTemplate.replace('{zipcode}',zipCode);
request(weatherUrl, function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log('body:', body); // Print the HTML for the Google homepage.
});
