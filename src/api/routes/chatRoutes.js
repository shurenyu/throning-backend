const chatController = require('../controllers/chatController');

module.exports = (app, io) => {
  // websocket things
  app.route('/api/chat/new').post(chatController.startNewChat);
  app.route('/api/chat/open').post(chatController.openChats);
  app.route('/api/chat/update-read').post(chatController.updateReadStatus);
  app.route('/api/chat/unread').post(chatController.getUnreadChats);

  io.on('connection', function(socket) {
    const $socket = socket;
    console.log('websocket connected, socket ID: ' + socket.id);
    // io.sockets.emit('recieve notificaiton', 'hey notification');

    socket.on('private chat', function(fbId, chatId, chat) {
      chatController.recievePrivateChat(fbId, chatId, chat, io);
    });

    socket.on('init socket', function(from) {
      chatController.initClientSocket(from, socket.id);
    });
  });
};
