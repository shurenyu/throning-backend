const moment = require('moment');
const dbUtils = require('../../utils/dbUtils');
const imageUtils = require('../../utils/imageUtils');
const peopleController = require('./peopleController');
const stocksnap = require('stocksnap.io');
const Mixpanel = require('mixpanel');
const bugsnag = require('@bugsnag/js');
const bugsnagExpress = require('@bugsnag/plugin-express');
const bugsnagClient = bugsnag('26ef4241b9b5c6bf255f5c54c6ae144d');
bugsnagClient.use(bugsnagExpress);

const mixpanel = Mixpanel.init('bbbec7f27f28682a69cb73c2323279d1');

const createEvent = async (eventPayload, user) => {
  let { imageUri } = eventPayload;
  imageUri = imageUri || 'https://pixy.org/images/placeholder.png';
  const adjustedUri = await imageUtils.uploadEventImage(imageUri);
  const event = {
    title: eventPayload.title,
    createdTime: moment(),
    imageUri: adjustedUri,
    location: eventPayload.location,
    description: eventPayload.description,
    recurring: eventPayload.recurring,
    // attendees: [],
    date: eventPayload.date,
    host: eventPayload.host,
    eventTime: eventPayload.eventTime,
    ageRange: eventPayload.ageRange,
    messageIds: [],
    isPrivate: eventPayload.isPrivate,
    openInvite: eventPayload.openInvite,
    relationshipPref: eventPayload.relationshipPref,
    images: [],
    attendeedsInRelationship: 0,
    attendeedsSingle: 0,
    attendeedsMarried: 0,
    coHost: eventPayload.coHost,
    geo: {
      type: 'Point',
      coordinates: [eventPayload.location.data.longitude, eventPayload.location.data.latitude]
    }
  };
  // event.eventTime.timeStr = moment(eventPayload.eventTime.timeStr);
  mixpanel.track('new event', {
    title: event.title,
    location: event.location.name,
    private: event.isPrivate,
    'event-date': event.date.dateStr
  });
  return dbUtils.saveEventToDb(event);
};

const updateEvent = async (id, eventPayload) => {
  const { imageBase64, imageType = 'jpg' } = eventPayload;
  let { imageUri } = eventPayload;
  if (imageBase64) {
    // User is updating the photo
    try {
      imageUri = await imageUtils.uploadImage(imageBase64, imageType);
    } catch (err) {
      bugsnagClient.notify(err);
      console.log(`Failure to upload image ${err}`);
    }
  }

  const adjustedUri = await imageUtils.uploadEventImage(imageUri);

  const event = {
    ...eventPayload,
    imageUri: adjustedUri
  };

  try {
    if (eventPayload.coHost.name !== 'co host' && eventPayload.coHost) {
      const coHostUser = await dbUtils.getUser(eventPayload.coHost.id);
      await dbUtils.userAddJoinedEvent(eventPayload.coHost.id, id);
      await dbUtils.eventAddJoinedUser(id, eventPayload.coHost.id, coHostUser.relationshipStatus);
      dbUtils.userAddNotification(eventPayload.coHost.id, eventPayload.host, id, 'coHost');
    }
  } catch (e) {
    bugsnagClient.notify(e);
    console.log('error adding cohost: ', e);
  }

  // return dbUtils.modifyEventInDb(id, eventPayload);
  return dbUtils.modifyEventInDb(id, event);
};

const eventReceived = async (req, res) => {
  const payload = {
    ...req.body
  }; // TODO get the host from the session, not the front end
  const { event, user } = payload;

  try {
    const eventDoc = await createEvent(event, user);
    try {
      dbUtils.userAddJoinedEvent(user._id, eventDoc._id);
      console.log('eventDoc.coHost.name: ', eventDoc.coHost.name);
      console.log('eventDoc.coHost: ', eventDoc.coHost);
      if (eventDoc.coHost.name !== 'co host' && eventDoc.coHost) {
        console.log('co host needs a notification');
        const coHostUser = await dbUtils.getUser(eventDoc.coHost.id);
        await dbUtils.userAddJoinedEvent(eventDoc.coHost.id, eventDoc._id);
        await dbUtils.eventAddJoinedUser(
          eventDoc._id,
          eventDoc.coHost.id,
          coHostUser.relationshipStatus
        );
        dbUtils.userAddNotification(eventDoc.coHost.id, user._id, eventDoc._id, 'coHost');
      }
      const joinedEventDoc = await dbUtils.eventAddJoinedUser(
        eventDoc._id,
        user._id,
        user.relationshipStatus
      );
      res.status = 200;
      res.json(joinedEventDoc);
    } catch (e) {
      bugsnagClient.notify(e);
      console.log(`Failed to add user to event: ${e}`);
      res.status = 200;
      res.json(eventDoc);
    }
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failed to create event: ${err}`);
    res.status = 500;
    res.json({ success: false });
  }
};

const updateEventReceived = async (req, res) => {
  console.log('updateEventReceived');
  console.log(req.params.eventId);
  console.log(req.body);
  const id = req.params.eventId;
  const payload = {
    ...req.body
  };

  try {
    const eventDoc = await updateEvent(id, payload);
    console.log('eventDoc from update: ', eventDoc);
    res.status = 200;
    res.json(eventDoc);
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failed to create event: ${err}`);
    res.status = 500;
    res.json({ success: false });
  }
};

const getEventsNearLocation = async location => {
  // ???
};

const getMyEvents = async (req, res) => {
  //console.log('get my events');
  const { userId } = req.body;
  let attendingEvents;
  let user;
  let events;
  let joinedEventKeys;

  try {
    user = await dbUtils.getUser(userId);
    // const acceptedEventKeys = Object.keys(user.acceptedEventInvites);
    joinedEventKeys = Object.keys(user.joinedEvents);
    // const totalEventKeys = acceptedEventKeys.concat(joinedEventKeys);
    events = await dbUtils.getAttendingEvents(joinedEventKeys);
    // events = await dbUtils.getMyEvents(userId); events =
    // events.concat(attendingEvents);
  } catch (err) {
    bugsnagClient.notify(err);
    //console.log('getmyEvents');
    console.log(`Error getting events: ${err}`);
    res.status = 500;
    res.json([]);
  }
  res.status = 200;
  res.json(events);
};

// const getEventsV3 = async (req, res) => {   const { location, userId } =
// req.body;   let myEvents;   let closeEvents;   let userEvents;   try { const
// user = await dbUtils.getUser(userId);     const joinedEventKeys =
// Object.keys(user.joinedEvents);     myEvents = await
// dbUtils.getMyEvents(userId);     const myEventsKeys = myEvents.map(event =>
// event._id);     const excluded = myEventsKeys.concat(joinedEventKeys);   }
// catch (e) {
// bugsnagClient.notify(e); console.log(e);   } };

const getEventsV2 = async (req, res) => {
  const { location, userId } = req.body;
  let myEvents;
  let closeEvents;
  let userEvents;
  let tierOne = [];
  let tierTwo = [];
  let tierThree = [];
  let tierFour = [];

  try {
    if (!location || !userId) {
      throw new Error('missing reqs');
    } else {
      const user = await dbUtils.getUser(userId);
      const joinedEventKeys = Object.keys(user.joinedEvents);
      myEvents = await dbUtils.getMyEvents(userId);
      const myEventsKeys = myEvents.map(event => event._id);
      const excluded = myEventsKeys.concat(joinedEventKeys);
      // console.log('user: ', user);
      // console.log('joinedEventsKeys: ', joinedEventKeys);
      // console.log('myEventsKeys: ', myEventsKeys);
      //console.log('excluded: ', excluded);

      tierOne = await dbUtils.getEventsViaGeoAndPref(
        location,
        excluded,
        user.agePref,
        user.relationshipPref,
        0
      );

      tierTwo = await dbUtils.getEventsViaGeoAndPref(
        location,
        excluded,
        user.agePref,
        user.relationshipPref,
        40233.6
      );

      tierThree = await dbUtils.getEventsViaGeoAndPref(
        location,
        excluded,
        user.agePref,
        user.relationshipPref,
        80467.2
      );

      tierFour = await dbUtils.getEventsViaGeoAndPref(
        location,
        excluded,
        user.agePref,
        user.relationshipPref,
        120701
      );

      closeEvents = tierOne.concat(tierTwo);
      closeEvents = closeEvents.concat(tierThree);
      closeEvents = closeEvents.concat(tierFour);
      // NEW events are events you have seen if a event is not in events and it is in
      // a lower tier than the index of the explore then temp move it to index the new
      // event should go right in front of index index should not be adjusted

      userEvents = user.events;
      // console.log('lengths of events and close events');
      // console.log(closeEvents.length); console.log(userEvents.length);
      if (closeEvents.length !== userEvents.length) {
        if (!user.exploreIndexs.events) {
          user.exploreIndexs.events = {};
        }
        let eventIndex = user.exploreIndexs.events[location.addressComponents.locality];
        if (eventIndex === null) {
          eventIndex = 0;
        }
        let homelessEvent = null;
        for (let x = 0; x < closeEvents.length; x++) {
          if (userEvents.indexOf(closeEvents[x]._id) < 0 && x < eventIndex) {
            homelessEvent = closeEvents[x];
            closeEvents.splice(x, 1);
            closeEvents.splice(eventIndex, 0, homelessEvent);
            userEvents.push(homelessEvent._id);
            // userEvents.splice(eventIndex, 0, closeEvents[x]._id); eventIndex++;
          }
        }
        //user.exploreIndexs.events[location.addressComponents.locality] = eventIndex;
        await dbUtils.updateEventOrder(userId, userEvents, user.exploreIndexs);
      }
      //closeEvents = await dbUtils.getAttendingEvents(userEvents);
    }
  } catch (err) {
    bugsnagClient.notify(err);
    console.log('get events v2');
    console.log(`Error getting events: ${err}`);
    res.status = 500;
    res.json([]);
  }
  // things to do on the server to increase client load speed and performance
  res.status = 200;
  res.json(closeEvents);
};

const getEvents = async (req, res) => {
  const { location, mine } = req.query;
  let events;

  try {
    if (location) {
      events = await getEventsNearLocation(location);
    } else if (mine) {
      events = await dbUtils.getMyEvents();
    } else {
      events = await dbUtils.getAllEvents();
    }
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error getting events: ${err}`);
    res.status = 500;
    res.json([]);
  }

  res.status = 200;
  res.json(events);
};

const eventSearch = async (req, res) => {
  try {
    const searchString = req.query.search;
    const foundEvents = await dbUtils.searchEvents(searchString);
    mixpanel.track('search for events', {
      searchTerm: searchString,
      'number-of-events-found': foundEvents.length
    });
    res.status = 200;
    res.json(foundEvents);
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error searching users: ${err}`);
    res.status = 500;
    res.json([]);
  }
};

const getEventPhotos = async (req, res) => {
  const { keyword } = req.query;
  const options = {
    sort: 'views'
  };
  const bannedList = await dbUtils.blahGetter('5c59150da8dad54f43a1541f');
  // Getting pictures of doors
  try {
    stocksnap(keyword, options, snaps => {
      for (let x = 0; x < snaps.length; x += 1) {
        if (
          snaps[x].indexOf('svg') > -1 ||
          snaps[x].indexOf('shutter') > -1 ||
          bannedList.random[snaps[x]]
        ) {
          snaps.splice(x, 1);
          x -= 1;
        }
      }

      res.status = 200;
      res.json({ success: true, picUrls: snaps });
    });
  } catch (err) {
    bugsnagClient.notify(err);
    res.status = 200;
    res.json({ success: false });
  }
};

const joinEvent = async (req, res) => {
  const { eventId, userId, userRelationshipStatus } = req.body;
  mixpanel.track('user joined event', {
    'event id': eventId,
    user: userId
  });
  try {
    // await Promise.all([   dbUtils.userAddJoinedEvent(userId, eventId),
    // dbUtils.eventAddJoinedUser(eventId, userId, userRelationshipStatus) ]);
    const updatedUser = await dbUtils.userAddJoinedEvent(userId, eventId);
    const updatedEvent = await dbUtils.eventAddJoinedUser(eventId, userId, userRelationshipStatus);
    peopleController.updateUserStandings([eventId], userId);
    res.status = 200;
    res.json({ success: true, event: updatedEvent, user: updatedUser });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error joining event: ${err}`);
    res.status = 500;
    res.json({ success: false });
  }
};

const eventCreateJoinRequest = async (req, res) => {
  const { eventId } = req.body;
  const fromUserId = req.session.userId;

  try {
    // We need to find out host to send notification to
    const event = await dbUtils.getEvent(eventId);
    const hostId = event.host;

    // await Promise.all([   dbUtils.eventAddUserJoinRequest(eventId, fromUserId),
    // dbUtils.userAddNotification(hostId, fromUserId, eventId, 'joinRequest') ]);

    const updatedEvent = await dbUtils.eventAddUserJoinRequest(eventId, fromUserId);
    dbUtils.userAddNotification(hostId, fromUserId, eventId, 'joinRequest');

    res.status = 200;
    res.json({ success: true, event: updatedEvent });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error requesting to join event: ${err}`);
    res.status = 500;
    res.json({ success: false });
  }
};

const eventApproveJoinRequest = async (req, res) => {
  const { eventId, joiningUserId, userRelationshipStatus, notificationId } = req.body;
  const hostId = req.session.userId;
  await dbUtils.removeNotification(hostId, notificationId); // this needs to happen first!
  try {
    await Promise.all([
      dbUtils.userAddJoinedEvent(joiningUserId, eventId),
      dbUtils.eventAddJoinedUser(eventId, joiningUserId, userRelationshipStatus),
      dbUtils.userAddNotification(joiningUserId, hostId, eventId, 'acceptedJoinRequest')
    ]);
    peopleController.updateUserStandings([eventId], joiningUserId);
    res.status = 200;
    res.json({ success: true });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error approving user to join event: ${err}`);
    res.status = 500;
    res.json({ success: false });
  }
};

const eventDeclineJoinRequest = async (req, res) => {
  const { eventId, userId, notificationId } = req.body;
  const hostId = req.session.userId;
  try {
    await dbUtils.eventDeclineJoinRequest(eventId, userId);
    dbUtils.removeNotification(hostId, notificationId);
    res.status = 200;
    res.json({ success: true });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error requesting to decline event join request: ${err}`);
  }
};

const leaveEvent = async (req, res) => {
  const { eventId, userId, userRelationshipStatus } = req.body;
  let updatedEvent = null;
  let updatedUser = null;
  try {
    // await Promise.all([   (updatedUser = dbUtils.userLeaveJoinedEvent(userId,
    // eventId)),   (updatedEvent = dbUtils.eventRemoveJoinedUser(eventId, userId,
    // userRelationshipStatus)) ]);
    updatedUser = await dbUtils.userLeaveJoinedEvent(userId, eventId);
    updatedEvent = await dbUtils.eventRemoveJoinedUser(eventId, userId, userRelationshipStatus);
    peopleController.updateUserStandings([eventId], userId);
    res.status = 200;
    res.json({ success: true, user: updatedUser, event: updatedEvent });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error leaving event: ${err}`);
    res.status = 500;
    res.json({ success: false });
  }
};

const uploadImage = async (req, res) => {
  const { eventId, userId, imagestr } = req.body;
  console.log('attempting to update images');
  try {
    const event = await dbUtils.getEvent(eventId);
    const jsEvent = event.toObject();
    jsEvent.images.push({ uri: imagestr, userId });
    const success = await dbUtils.modifyEventInDb(eventId, jsEvent);
    res.status = 200;
    res.json({ success });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error leaving event: ${err}`);
    res.status = 500;
    res.json({ success: false });
  }
};

const retrieveEvents = async (req, res) => {
  const { eventIds } = req.body;
  try {
    const eventKeys = Object.keys(eventIds);
    const attendingEvents = await dbUtils.getAttendingEvents(eventKeys);

    res.status = 200;
    res.json({ success: true, events: attendingEvents });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Error leaving event: ${err}`);
    res.status = 500;
    res.json({ success: false });
  }
};

const printShit = async (req, res) => {
  dbUtils.blahMaker(req.body.superData);
  res.json({});
};

const updateAttendance = async (req, res) => {
  const { eventId, user } = req.body;
  const startdate = moment();
  // startdate = startdate.subtract(1, 'days');
  user.joinedEvents[eventId] = {
    attended: true,
    date: startdate
  };
  try {
    const updatedUser = await dbUtils.modifyAttendance(user.fbId, user);
    res.status = 200;
    res.json(updatedUser);
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failed to update user attendance: ${err}`);
    res.status = 500;
    res.end();
  }
};

const deleteEvent = async (req, res) => {
  const { eventId, users } = req.body;
  mixpanel.track('delete event', { event: eventId });
  try {
    for (u in users) {
      await dbUtils.userLeaveJoinedEvent(u, eventId);
    }
    await dbUtils.deleteEvent(eventId);
    res.status = 200;
    res.json({ success: true });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failed to update user attendance: ${err}`);
    res.status = 500;
    res.end();
  }
};

const updateRelationshipData = async (req, res) => {
  const { eventId } = req.body;
  let taken = 0;
  let single = 0;
  let married = 0;

  try {
    const event = await dbUtils.getEvent(eventId);
    const { joinedUsers } = event;
    const userKeys = Object.keys(joinedUsers);
    const filtered = userKeys.filter(key => {
      return joinedUsers[key];
    });
    const eventUsers = await dbUtils.getUsers(filtered);

    for (user in eventUsers) {
      if (eventUsers[user].relationshipStatus === 'Single') {
        single++;
      } else if (eventUsers[user].relationshipStatus === 'Taken') {
        taken++;
      } else if (eventUsers[user].relationshipStatus === 'Married') {
        married++;
      } else {
        single++;
      }
    }
    event.attendeedsSingle = single;
    event.attendeedsInRelationship = taken;
    event.attendeedsMarried = married;
    dbUtils.modifyEventInDb(event._id, event);
    res.send({ success: true });
  } catch (e) {
    bugsnagClient.notify(e);
    res.send({ success: false });
    console.log(e);
  }
};

module.exports = {
  eventReceived,
  updateEventReceived,
  getEvents,
  eventSearch,
  getEventPhotos,
  joinEvent,
  eventCreateJoinRequest,
  eventApproveJoinRequest,
  eventDeclineJoinRequest,
  leaveEvent,
  getMyEvents,
  getEventsV2,
  uploadImage,
  retrieveEvents,
  printShit,
  updateAttendance,
  deleteEvent,
  updateRelationshipData
};
