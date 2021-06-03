const Mixpanel = require('mixpanel');
const dbUtils = require('../../utils/dbUtils');

const mixpanel = Mixpanel.init('bbbec7f27f28682a69cb73c2323279d1');
const bugsnag = require('@bugsnag/js');
const bugsnagExpress = require('@bugsnag/plugin-express');
const bugsnagClient = bugsnag('26ef4241b9b5c6bf255f5c54c6ae144d');
bugsnagClient.use(bugsnagExpress);
// This is called immediately after you connect to FB
const createMe = async mePayload => {
  const user = {
    email: mePayload.email,
    password: mePayload.password,
    loginType: mePayload.loginType,
    name: mePayload.name,
    isInRelationship: null,
    location: null,
    description: null,
    age: null,
    profilePic: null,
    relationshipStatus: 'Single',
    events: [],
    exploreIndexs: null,
    relationshipPref: null,
    agePref: { min: 18, max: 55 },
    recentInteractions: null,
    readNotifications: [],
    unreadNotifications: [],
    sexPreference: null,
    acceptedEventInvites: {},
    pendingEventInvites: {},
    declinedEventInvites: {},
    joinedEvents: { '5b29577d8fee3993dfdf9d32': null },
    socket: null,
    chats: [],
    rating: {
      numberOfRaters: 0,
      ratingSum: 500,
      currentRating: 0
    },
    photos: [],
    // geo: { type: 'Point', coordinates: [] },
    blocking: { hidefrom: { stub: null }, block: { stub: null } },
    fbId: mePayload.fbId
  };
  // user.geo.coordinates = [user.location.longitude, user.location.latitude];
  try {
    mixpanel.track('user created', {
      name: user.name
    });
  } catch (e) {
    bugsnagClient.notify(e);
    console.log('error with mixpanel');
    console.log(e);
  }
  return dbUtils.saveMeToDb(user);
};

// this can be used to get the user
const verifyMe = async id => dbUtils.verifyUser(id);

const loginUser = async (req, res) => {
  const { email, password, loginType, fbId, name } = req.body;
  try {
    if (loginType === 'email') {

    } else {
      const userData = await verifyMe(fbId);
      if (userData) {
        req.session.userId = userData._id;
        res.status = 200;
        res.send({
          success: true,
          user: userData,
          name,
          fbId: userData.fbId,
          isNew: false
        });
      } else {
        // lets create a new user
        const newUser = await createMe({ email, password, name, fbId, loginType });
        req.session.userId = newUser._id;
  
        res.status = 200;
        res.send({
          success: true,
          fbId,
          name,
          user: newUser,
          isNew: true
        });
      }
    }    
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`caught ${err}`);
    res.status = 200;
    res.send({ success: false });
  }
};

const updateMe = async (req, res) => {
  console.log('attempting to update me');
  const { fbId } = req.body;
  let meDoc;

  try {
    if (req.body.location) {
      console.log('modifyMeInDbWithGeo');
      meDoc = await dbUtils.modifyMeInDbWithGeo(fbId, req.body);
    } else {
      console.log('modifyMeInDb');
      meDoc = await dbUtils.modifyMeInDb(fbId, req.body);
    }

    res.status = 200;
    res.json(meDoc);
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error updating user: ${err}`);
    res.status = 500;
    res.json({});
  }
};

const updateExplore = async (req, res) => {
  console.log('updateExplore');
  const { user, type, newIndex } = req.body;
  console.log('check index here: ', newIndex);
  const currentCity = user.location.addressComponents.locality;
  console.log(user.exploreIndexs);

  if (!user.exploreIndexs.events) {
    user.exploreIndexs.events = {};
  }
  if (!user.exploreIndexs.people) {
    user.exploreIndexs.people = {};
  }
  console.log('type should be below');
  console.log(type);
  console.log(user.exploreIndexs[type][currentCity]);
  console.log(newIndex);
  user.exploreIndexs[type][currentCity] = newIndex;
  console.log('user.exploreIndexs[type][currentCity]: ', user.exploreIndexs[type][currentCity]);
  //console.log(user.fbId);
  try {
    const meDoc = await dbUtils.modifyExplore(user.fbId, user);
    //console.log('me doc below');
    //console.log(meDoc);
    res.status = 200;
    res.json(meDoc);
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error updating user for explore: ${err}`);
    res.status = 500;
    res.json({});
  }
};

const getMe = async (req, res) => {
  const fbId = req.headers.fbid;
  // const fbId = '10160166593535249';
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  try {
    const user = await verifyMe(fbId);
    //console.log(user);
    if (user) {
      req.session.userId = user._id;

      res.status = 200;
      res.send({ success: true, user });
    } else {
      res.status = 200;
      res.send({ success: false, user: null });
    }
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`caught ${err}`);
    res.status = 200;
    res.send({ success: false });
  }
};

const checkData = async (req, res) => {
  const fbId = req.headers.fbid;
  // const fbId = '10160166593535249';
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  try {
    const user = await verifyMe(fbId);
    //console.log(user);
    if (user) {
      req.session.userId = user._id;
      res.status = 200;
      if (user.unreadNotifications.length > 0) {
        res.send({ pullData: true, user });
      }
      res.send({ pullData: false });
    } else {
      res.status = 200;
      res.send({ success: false, user: null });
    }
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`caught ${err}`);
    res.status = 200;
    res.send({ success: false });
  }
};

const loginMe = async (req, res) => {
  const fbId = req.headers.fbid;
  // const fbId = '10160166593535249';
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  try {
    const user = await verifyMe(fbId);
    //console.log(user);
    mixpanel.track('login', {
      name: user.name
    });
    if (user) {
      req.session.userId = user._id;

      res.status = 200;
      res.send({ success: true, user });
    } else {
      res.status = 200;
      res.send({ success: false, user: null });
    }
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`caught ${err}`);
    res.status = 200;
    res.send({ success: false });
  }
};

const userSearch = async (req, res) => {
  try {
    const searchString = req.query.search;
    const foundUsers = await dbUtils.searchUsers(searchString);
    res.status = 200;
    res.json(foundUsers);
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error searching users: ${err}`);
    res.status = 500;
    res.json([]);
  }
};

const getUsers = async (req, res) => {
  const { userIds } = req.query;

  try {
    const users = await dbUtils.getUsers(userIds);
    res.status = 200;
    res.json(users);
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failed to get specific users: ${err}`);
    res.status = 500;
    res.end();
  }
};

const blockUser = async (req, res) => {
  const { blockie, blocker, reason } = req.body;

  try {
    const result = await dbUtils.blockUser(blockie, blocker, reason);
    const track = { blocker: blocker.name, blockie: blockie.name, reason: reason };
    mixpanel.track('block user', track);
    res.status = 200;
    res.json({ success: result });
  } catch (e) {
    bugsnagClient.notify(e);
    console.log(`Failed to block user: ${e}`);
    res.status = 500;
    res.end();
  }
};

const reportUser = async (req, res) => {
  const { blockie, blocker, reason } = req.body;
  const track = { blocker: blocker.name, blockie: blockie.name, reason: reason };
  mixpanel.track('report user', track);
  try {
    const result = await dbUtils.reportUser(blockie, blocker, reason);
    res.status = 200;
    res.json({ success: result });
  } catch (e) {
    bugsnagClient.notify(e);
    console.log(`Failed to block user: ${e}`);
    res.status = 500;
    res.end();
  }
};

const deleteEvent = async event => {
  console.log('deleting event');
  try {
    for (u in event.joinedUsers) {
      await dbUtils.userLeaveJoinedEvent(u, event._id.toString());
    }
    await dbUtils.deleteEvent(event._id.toString());
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failed to update user attendance: ${err}`);
  }
  return null;
};

const deleteProfile = async (req, res) => {
  const { fbId } = req.body;
  console.log('user is deleting their profile');
  // go through each event and remove the user, if the user is the host then delete the event all together

  try {
    let user = await dbUtils.getUsersByFbId(fbId);
    user = user[0];
    mixpanel.track('delete profile', { user: user.name });
    //console.log(user);
    let currentEvent = null;
    try {
      for (e in user.joinedEvents) {
        currentEvent = await dbUtils.getEvent(e);
        console.log(currentEvent.host);
        console.log(user._id);
        if (currentEvent.host.toString() === user._id.toString()) {
          console.log('user is host delete event');
          deleteEvent(currentEvent);
        } else {
          console.log('remove user from event');
          dbUtils.eventRemoveJoinedUser(e, user._id, user.single);
        }
      }
    } catch (e) {
      bugsnagClient.notify(e);
      console.log(e);
    }
    const donzo = await dbUtils.deleteProfile(fbId);
    console.log(donzo);
    res.status = 200;
    res.json({ success: true });
  } catch (e) {
    bugsnagClient.notify(e);
    console.log(`Failed to delete user: ${e}`);
    res.status = 500;
    res.end();
  }
};

module.exports = {
  createMe,
  updateMe,
  getMe,
  getUsers,
  loginUser,
  userSearch,
  updateExplore,
  blockUser,
  reportUser,
  deleteProfile,
  loginMe,
  checkData
};
