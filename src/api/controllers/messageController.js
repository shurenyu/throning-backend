const moment = require('moment');
const dbUtils = require('../../utils/dbUtils');

const createMessage = async (id, messagePayload) => {
  const message = {
    eventId: id,
    userId: messagePayload.userId,
    userImageUri: messagePayload.userImageUri,
    userName: messagePayload.userName,
    createdTime: moment(),
    text: messagePayload.text
  };

  return dbUtils.saveMessageToDb(message);
};

const messageReceived = async (req, res) => {
  const id = req.params.eventId;
  const payload = { ...req.body }; // TODO we actually want this: , userId: req.session.userId };

  try {
    const messageDoc = await createMessage(id, payload);
    res.status = 200;
    res.json(messageDoc);
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failed to create message: ${err}`);
    res.status = 500;
    res.json({
      success: false
    });
  }
};

const getMessages = async (req, res) => {
  const { ids } = req.query;
  const messageIds = ids ? ids.split(',') : [];

  let messages = [];
  try {
    if (messageIds.length > 0) {
      messages = await dbUtils.getMessages(messageIds);
    }
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error getting messages: ${err}`);
    res.status = 500;
    res.json([]);
  }

  res.status = 200;
  res.json(messages);
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const messages = await dbUtils.getMessages([messageId]);

    if (messages.length !== 1) {
      res.status = 404;
      res.json({ success: false });
    }

    if (messages[0].userId !== req.session.userId) {
      res.status = 401;
      res.json({ success: false });
    }

    await dbUtils.deleteMessage(messageId);
  } catch (err) {
    bugsnagClient.notify(err);
    res.status = 500;
    res.json({ success: false });
  }

  res.status = 200;
  res.json({ success: true });
};

module.exports = {
  messageReceived,
  getMessages,
  deleteMessage
};
