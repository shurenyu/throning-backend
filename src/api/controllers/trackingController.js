const Mixpanel = require('mixpanel');
const dbUtils = require('../../utils/dbUtils');

const getAppStats = async (req, res) => {
  const users = await dbUtils.getUserCount();
  const userCount = users.length;
  const events = await dbUtils.getEventCount();
  const eventCount = events.length;
  const notifications = await dbUtils.getNotificationCount();
  const notificationsCount = notifications.length;
  res.send({
    userCount: userCount,
    eventCount: eventCount,
    notificationsCount: notificationsCount
  });
};

module.exports = {
  getAppStats
};
