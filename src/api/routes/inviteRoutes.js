const inviteController = require('../controllers/inviteController');

module.exports = (app, io) => {
  app.route('/api/invites/create').post((req, res) => {
    inviteController.createInvite(req, res, io);
  });
  app.route('/api/invites/accept').post(inviteController.acceptInvite);
  app.route('/api/invites/decline').post(inviteController.declineInvite);
};
