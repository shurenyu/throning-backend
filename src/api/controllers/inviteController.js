const dbUtils = require('../../utils/dbUtils');

const pushNotification = async (userId, io) => {
  const usersData = await dbUtils.getUser(userId);
  console.log('push notification');
  console.log(usersData.socket.id);
  // no need to pass anything because this should trigger the client to request data
  io.sockets.connected[usersData.socket.id].emit('recieve notificaiton', 'true');
};

const createInvite = async (req, res, io) => {
  const { toUserId, fromUserId, eventId } = req.body;
  console.log('event id');
  console.log(eventId);
  const invitePromises = Promise.all([
    dbUtils.userAddPendingInvite(toUserId, fromUserId, eventId),
    dbUtils.eventAddPendingInvite(eventId, toUserId)
  ]);

  // TODO: we should be using this becuase it only emits to the right user but aye for now fuck it
  // pushNotification(toUserId, io);
  io.sockets.emit('recieve notificaiton', 'true');

  invitePromises
    .then(() => {
      res.status = 200;
      res.json({
        success: true
      });
    })
    .catch(err => {
      console.log(`Failed to create invite: ${err}`);
      res.status = 500;
      res.end();
    });
};

const acceptInvite = (req, res) => {
  const { userId, userRelationshipStatus = 'Single', eventId } = req.body;

  const invitePromises = Promise.all([
    dbUtils.userAddAcceptedInvite(userId, eventId),
    dbUtils.eventAddAcceptedInvite(eventId, userId, userRelationshipStatus)
  ]);

  invitePromises
    .then(() => {
      res.status = 200;
      res.json({
        success: true
      });
    })
    .catch(err => {
      console.log(`Failed to accept invite: ${err}`);
      res.status = 500;
      res.end();
    });
};

const declineInvite = (req, res) => {
  const { toUserId, eventId } = req.body;

  const invitePromises = Promise.all([
    dbUtils.userAddDeclinedInvite(toUserId, eventId),
    dbUtils.eventAddDeclinedInvite(eventId, toUserId)
  ]);

  invitePromises
    .then(() => {
      res.status = 200;
      res.json({
        success: true
      });
    })
    .catch(err => {
      console.log(`Failed to decline invite: ${err}`);
      res.status = 500;
      res.end();
    });
};

module.exports = { createInvite, acceptInvite, declineInvite };
