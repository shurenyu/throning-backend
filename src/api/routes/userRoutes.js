const userController = require('../controllers/userController');

module.exports = app => {
  app
    .route('/api/user')
    .get(userController.getMe)
    .post(userController.loginUser)
    .put(userController.updateMe);

  app.route('/api/user/login').get(userController.loginMe);
  app.route('/api/user/register').post(userController.register);
  app.route('/api/user/search').get(userController.userSearch);
  app.route('/api/user/select').get(userController.getUsers);
  app.route('/api/user/update-explore').post(userController.updateExplore);
  app.route('/api/user/block').post(userController.blockUser);
  app.route('/api/user/report').post(userController.reportUser);
  app.route('/api/user/delete').post(userController.deleteProfile);
  app.route('/api/user/datacheck').post(userController.checkData);
};
