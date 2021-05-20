const imageController = require('../controllers/imageController');

module.exports = app => {
  app.route('/api/images').post(imageController.proccessImage);
  app.route('/api/images/ban').post(imageController.banImage);
};
