const messageController = require('../controllers/messageController');

module.exports = app => {
  app.route('/api/messages').get(messageController.getMessages);

  app.route('/api/messages/:eventId').post(messageController.messageReceived);

  app.route('/api/messages/:messageId').delete(messageController.deleteMessage);
};
