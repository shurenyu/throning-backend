const peopleController = require('../controllers/peopleController');

module.exports = app => {
  app.route('/api/people/retrieve-by-location').post(peopleController.retrieveByLocationV2);
  app.route('/api/people/update-rating').post(peopleController.updateRating);
  app.route('/api/people/user-has-rated').post(peopleController.userHasRated);
};
