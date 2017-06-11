var request = require('request');
var weatherUrlTemplate = 'https://api.weather.com/v1/location/{zipcode}:4:US/forecast/daily/10day.json?language=en-US&units=e&apiKey=f43934a981fc48f5926e5929d3ee0760'; 
var zipCode=81657;
var day = 6;
var weatherUrl = weatherUrlTemplate.replace('{zipcode}',zipCode);
request(weatherUrl, function (error, response, body) {
  var wc = JSON.parse(body).forecasts[day].day.wc;
  var pop = Math.round(Math.random()*10)*10;
  var temperature = Math.round(parseInt(wc) - Math.random()*40);
  console.log('temerature', temperature); 
  console.log('chance of precipitation', pop); 
});
