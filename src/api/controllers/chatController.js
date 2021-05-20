const dbUtils = require('../../utils/dbUtils');

const findUserInChats = (reciever, chats) => {
  console.log('checking for existing chats');
  for (x in chats) {
    if (chats[x].users.indexOf(reciever.fbId) > 0) {
      return chats[x];
    }
  }
  return null;
};

const createNewChat = async (user, reciever) => {
  let chats = user.chats;
  let fullChats = null;
  let recieverChats = reciever.chats;
  let oldChat = null;
  console.log('attempting to create new chat');
  if (!recieverChats || recieverChats.length === 0) {
    recieverChats = [];
  }
  if (!chats || chats.length === 0) {
    // create new chats array and then create new chat
    chats = [];
  } else {
    // lets get the chats
    fullChats = await dbUtils.getChats(chats);
    oldChat = findUserInChats(reciever, fullChats);
    if (oldChat) {
      return oldChat;
    }
  }
  // const fullRecieverChats = await dbUtils.getUser(recieverChats);
  const newChat = await dbUtils.createChat(user, reciever);
  console.log('newChat from DB');
  chats.push(newChat._id);
  recieverChats.push(newChat._id);
  console.log('user chat ids below');
  console.log(chats);
  const userChats = await dbUtils.saveChat(user, chats);
  await dbUtils.saveChat(reciever, recieverChats);
  console.log('user chats below');
  console.log(userChats);
  return newChat;
};

const startNewChat = async (req, res) => {
  //console.log(req.body);
  const reciever = req.body.reciever;
  const user = req.body.user;
  console.log('receieved chat information');
  try {
    const newChat = await createNewChat(user, reciever);
    console.log(newChat);
    res.status = 200;
    res.send({
      chat: newChat,
      success: true
    });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failure to create new Chat ${err}`);
    res.status = 200;
    res.send({
      success: false,
      chat: null
    });
  }
};

const openChats = async (req, res) => {
  const chatIds = req.body.chatIds;
  try {
    const chats = await dbUtils.getChats(chatIds);
    // console.log(chats);
    res.status = 200;
    res.send({
      chats: chats,
      success: true
    });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failure to get Chats ${err}`);
    res.status = 200;
    res.send({
      success: false,
      chats: null
    });
  }
};

const initClientSocket = async (fbId, socketId) => {
  const UpdatedSocket = { id: socketId, connected: true };
  const updatedUser = await dbUtils.updateSocketId(fbId, UpdatedSocket);
  return updatedUser;
};

const recievePrivateChat = async (fbId, chatId, chat, io) => {
  console.log('chat recieved');
  console.log(chat);
  let chatData = await dbUtils.getChats([chatId]);
  chatData = chatData[0];

  if (!chatData) {
    //TODO: return error to client
  }

  chatData.messages.unshift(chat);
  chatData.latestTime = chat.createdAt;

  const updatedChat = await dbUtils.updateChat(chatData);
  const usersData = await dbUtils.getUsersByFbId(updatedChat.users);
  // console.log('chats been updated lets send it out');
  // console.log(updatedChat);
  for (u in usersData) {
    //usersData[u].socket.id
    // console.log(io.sockets);
    //io.sockets.connected[usersData[0].socket.id].emit('recieve message', updatedChat);
    //io.sockets.connected[usersData[1].socket.id].emit('recieve message', updatedChat);
  }
  // io.sockets.connected[usersData[0].socket.id].emit('recieve message', updatedChat);
  // io.sockets.connected[usersData[1].socket.id].emit('recieve message', updatedChat);
  // // socket.socket.broadcast.emit('recieve message', 'hey you got mail');
};

const updateReadStatus = async (req, res) => {
  const chatId = req.body.chatId;
  const messages = req.body.messages;
  console.log('attempting to update status');
  try {
    const success = await dbUtils.updateReadStatus(chatId, messages);
    res.status = 200;
    res.send({
      success: true
    });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failure to update Chats ${err}`);
    res.status = 200;
    res.send({
      success: false
    });
  }
};

const getUnreadChats = async (req, res) => {
  const chatIds = req.body.chatIds;
  const username = req.body.username;

  //console.log('chatIds: ', chatIds);
  try {
    const chats = await dbUtils.getChats(chatIds);
    //console.log('chats: ', chats);
    let unread = 0;
    for (c in chats) {
      try {
        if (
          chats[c].messages[0] &&
          !chats[c].messages[0].user.read &&
          chats[c].messages[0].user.reciever === username
        ) {
          unread++;
        }
      } catch (e) {
        bugsnagClient.notify(e);
        console.log(e);
      }
    }

    console.log('unread below');
    console.log(unread);

    res.status = 200;
    res.send({
      success: true,
      unread: unread
    });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failure to get unread Chats ${err}`);
    res.status = 200;
    res.send({
      success: false,
      unread: null
    });
  }
};

module.exports = {
  startNewChat,
  openChats,
  initClientSocket,
  recievePrivateChat,
  updateReadStatus,
  getUnreadChats
};
