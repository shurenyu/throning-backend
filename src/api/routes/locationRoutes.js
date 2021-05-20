const locationController = require('../controllers/locationController');

module.exports = app => {
  app.route('/api/location/city-details').post(locationController.getCityDetials);
  app.route('/api/location/places-search').post(locationController.getSearchResults);
  app.route('/api/location/places-details').post(locationController.getPlaceDetails);
};
