const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const Blah = require('../models/Blah');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const userUtils = require('./userUtils');
const moment = require('moment');

// Event.find({
//   geo: {
//     $near: {
//       $geometry: {
//         type: 'Point',
//         coordinates: [-84.3879824, 33.7489954]
//       },
//       $maxDistance: 20000
//     }
//   }
// }).then(data => {
//   console.log(data);
// });
// const cloudinary = require('cloudinary');

// cloudinary.config({
//   cloud_name: process.env.cloudinaryName,
//   api_key: process.env.cloudinaryKey,
//   api_secret: process.env.cloudinarySecret
// });

// cloudinary.uploader.upload('https://cdn.stocksnap.io/img-thumbs/960w/9RLY1DKQNX.jpg', result => {
//   if (result.error) {
//     console.log(new Error(result.error.message));
//   } else {
//     console.log(result.secure_url);
//   }
// });

// Event.find({}).then(data => {
//   data.forEach(event => {
//     const imageStr = event.imageUri;
//     console.log('imageStr: ', imageStr);
//     cloudinary.uploader.upload(imageStr, result => {
//       if (result.error) {
//         console.log(new Error(result.error.message));
//       } else {
//         console.log(result.secure_url);
//         Event.update({ _id: event._id }, { imageUri: result.secure_url }).then((err, data) => {
//           if (err) {
//             console.log(err);
//           }
//         });
//       }
//     });
//   });
// });

const getUserCount = async () => {
  return User.find({});
};

const getEventCount = async () => {
  return Event.find({});
};

const getNotificationCount = async () => {
  return Notification.find({});
};

// Events
const getEvent = async id => Event.findById(id);

const normalizeDates = event => ({
  ...event,
  createdTime: new Date(event.createdTime),
  eventTime: new Date(event.eventTime.timeStr)
});

const saveEventToDb = async eventItem => {
  const event = new Event(eventItem);
  return event.save();
};

const modifyEventInDb = async (id, eventItem) => {
  //const normalizedEvent = normalizeDates(eventItem);
  return Event.findByIdAndUpdate(id, eventItem, { new: true });
};

const getEventsByCity = async (location, exlcuded) => {
  const city = location.addressComponents.locality;
  // const mongooseExcludedEventIds = exlcuded.map(event => new mongoose.Types.ObjectId(event._id));
  return Event.find({
    $and: [{ 'location.data.addressComponents.locality': city }, { _id: { $nin: exlcuded } }]
  });
};

const getEventsByState = async (location, exlcuded) => {
  const state = location.addressComponents.administrative_area_level_1;
  // const mongooseExcludedEventIds = exlcuded.map(event => new mongoose.Types.ObjectId(event._id));
  return Event.find({
    $and: [
      { 'location.data.addressComponents.administrative_area_level_1': state },
      { _id: { $nin: exlcuded } }
    ]
  });
};

const getPeopleViaGeo = async (location, exlcuded) => {
  const long = location.longitude;
  const lat = location.latitude;

  return User.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: 321869
          }
        }
      },
      { _id: { $nin: exlcuded } }
    ]
  });
};

const getEventsViaGeo = async (location, exlcuded) => {
  const long = location.longitude;
  const lat = location.latitude;
  return Event.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: 321869
          }
        }
      },
      { _id: { $nin: exlcuded } }
    ]
  });
};

const getSegmentOne = async (long, lat, exlcuded, agePref, relationshipPref, tier) => {
  const queryMax = agePref.max;
  const queryMin = agePref.min;
  const maxDist = tier + 40233;
  // console.log(queryMax);
  // console.log(queryMin);
  // console.log(maxDist);
  // console.log(exlcuded.length);
  // console.log(relationshipPref);
  // console.log(tier);
  return Event.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: maxDist,
            $minDistance: tier
          }
        }
      },
      { _id: { $nin: exlcuded } },
      { relationshipPref },
      { 'ageRange.max': { $lte: queryMax } },
      { 'ageRange.min': { $gte: queryMin } }
    ]
  });
};

const getSegmentTwo = async (long, lat, exlcuded, agePref, relationshipPref, tier) => {
  const queryMax = agePref.max;
  const queryMin = agePref.min;
  const maxDist = tier + 40233;

  return Event.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: maxDist,
            $minDistance: tier
          }
        }
      },
      { _id: { $nin: exlcuded } },
      { 'ageRange.max': { $lte: queryMax } },
      { 'ageRange.min': { $gte: queryMin } }
    ]
  });
};

const getSegmentThree = async (long, lat, exlcuded, agePref, relationshipPref, tier) => {
  const queryMax = agePref.max;
  const queryMin = agePref.min;
  const maxDist = tier + 40233;

  return Event.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: maxDist,
            $minDistance: tier
          }
        }
      },
      { _id: { $nin: exlcuded } },
      { relationshipPref }
    ]
  });
};

const getSegmentFour = async (long, lat, exlcuded, agePref, relationshipPref, tier) => {
  const queryMax = agePref.max;
  const queryMin = agePref.min;
  const maxDist = tier + 40233;

  return Event.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: maxDist,
            $minDistance: tier
          }
        }
      },
      { _id: { $nin: exlcuded } }
    ]
  });
};

const getPeopleSegmentOne = async (long, lat, exlcuded, agePref, relationshipPref, tier) => {
  const queryMax = agePref.max;
  const queryMin = agePref.min;
  const maxDist = tier + 40233;
  // console.log(queryMax);
  // console.log(queryMin);
  // console.log(maxDist);
  // console.log(exlcuded.length);
  // console.log(relationshipPref);
  // console.log(tier);
  // console.log(lat);
  // console.log(long);
  return User.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: maxDist,
            $minDistance: tier
          }
        }
      },
      { _id: { $nin: exlcuded } },
      // { relationshipStatus: relationshipPref },
      { relationshipStatus: 'Taken' },
      { age: { $lte: queryMax } },
      { age: { $gte: queryMin } }
    ]
  });
};

const getPeopleSegmentTwo = async (long, lat, exlcuded, agePref, relationshipPref, tier) => {
  const queryMax = agePref.max;
  const queryMin = agePref.min;
  const maxDist = tier + 40233;
  // console.log(queryMax);
  // console.log(queryMin);
  // console.log(maxDist);
  // console.log(exlcuded.length);
  // console.log(relationshipPref);
  // console.log(tier);
  return User.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: maxDist,
            $minDistance: tier
          }
        }
      },
      { _id: { $nin: exlcuded } },
      { age: { $lte: queryMax } },
      { age: { $gte: queryMin } }
    ]
  });
};

const getPeopleSegmentThree = async (long, lat, exlcuded, agePref, relationshipPref, tier) => {
  const maxDist = tier + 40233;
  // console.log(queryMax);
  // console.log(queryMin);
  // console.log(maxDist);
  // console.log(exlcuded.length);
  // console.log(relationshipPref);
  // console.log(tier);
  return User.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: maxDist,
            $minDistance: tier
          }
        }
      },
      { _id: { $nin: exlcuded } },
      { relationshipStatus: relationshipPref }
    ]
  });
};

const getPeopleSegmentFour = async (long, lat, exlcuded, agePref, relationshipPref, tier) => {
  const maxDist = tier + 40233;
  // console.log(queryMax);
  // console.log(queryMin);
  // console.log(maxDist);
  // console.log(exlcuded.length);
  // console.log(relationshipPref);
  // console.log(tier);
  return User.find({
    $and: [
      {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [long, lat]
            },
            $maxDistance: maxDist,
            $minDistance: tier
          }
        }
      },
      { _id: { $nin: exlcuded } }
    ]
  });
};

const getPeopleViaGeoAndPref = async (location, exlcuded, agePref, relationshipPref, tier) => {
  const long = location.longitude;
  const lat = location.latitude;
  let people = [];
  let updatedExcluded;

  const segmentOne = await getPeopleSegmentOne(
    long,
    lat,
    exlcuded,
    agePref,
    relationshipPref,
    tier
  );
  //console.log('segmentOne', segmentOne);
  updatedExcluded = segmentOne.concat(exlcuded);

  const segmentTwo = await getPeopleSegmentTwo(
    long,
    lat,
    updatedExcluded,
    agePref,
    relationshipPref,
    tier
  );
  updatedExcluded = updatedExcluded.concat(segmentTwo);
  //console.log('segmentTwo', segmentTwo);

  const segmentThree = await getPeopleSegmentThree(
    long,
    lat,
    updatedExcluded,
    agePref,
    relationshipPref,
    tier
  );
  updatedExcluded = updatedExcluded.concat(segmentTwo);
  // console.log('segmentThree', segmentThree);

  const segmentFour = await getPeopleSegmentFour(
    long,
    lat,
    updatedExcluded,
    agePref,
    relationshipPref,
    tier
  );

  people = people.concat(segmentOne);
  people = people.concat(segmentTwo);
  people = people.concat(segmentThree);
  people = people.concat(segmentFour);
  return people;
};

const getEventsViaGeoAndPref = async (location, exlcuded, agePref, relationshipPref, tier) => {
  const long = location.longitude;
  const lat = location.latitude;
  let events = [];
  let updatedExcluded;
  // console.log(
  //   'long: ',
  //   long,
  //   'lat: ',
  //   lat,
  //   'exlcuded: ',
  //   exlcuded,
  //   'agePref: ',
  //   agePref,
  //   'relationship: ',
  //   relationshipPref,
  //   'tier: ',
  //   tier
  // );
  const segmentOne = await getSegmentOne(long, lat, exlcuded, agePref, relationshipPref, tier);
  updatedExcluded = segmentOne.concat(exlcuded);

  const segmentTwo = await getSegmentTwo(
    long,
    lat,
    updatedExcluded,
    agePref,
    relationshipPref,
    tier
  );
  updatedExcluded = updatedExcluded.concat(segmentTwo);

  const segmentThree = await getSegmentThree(
    long,
    lat,
    updatedExcluded,
    agePref,
    relationshipPref,
    tier
  );
  updatedExcluded = updatedExcluded.concat(segmentTwo);

  const segmentFour = await getSegmentFour(
    long,
    lat,
    updatedExcluded,
    agePref,
    relationshipPref,
    tier
  );

  //console.log('events here', segmentOne);
  events = events.concat(segmentOne);
  events = events.concat(segmentTwo);
  events = events.concat(segmentThree);
  events = events.concat(segmentFour);
  return events;
};

const getAttendingEvents = async attendingEvents => {
  const mongooseAttendingEventIds = attendingEvents.map(
    eventId => new mongoose.Types.ObjectId(eventId)
  );

  return Event.find({ _id: { $in: mongooseAttendingEventIds } });
};

const getAttendingPeople = async attendingPeople => {
  const mongooseAttendingEventIds = attendingPeople.map(
    userId => new mongoose.Types.ObjectId(userId)
  );
  return User.find({ _id: { $in: mongooseAttendingEventIds } });
};

const getAllEvents = async () =>
  Event.find()
    .sort('eventTime')
    .exec();

const getMyEvents = async userId =>
  Event.find({ host: userId })
    .sort('eventTime')
    .exec();

const eventAddPendingInvite = async (eventId, userId) => {
  const eventDoc = await getEvent(eventId);
  const { invitedUsers = {} } = eventDoc;
  invitedUsers[userId] = true;

  return Event.findByIdAndUpdate(eventId, { invitedUsers }, { new: true });
};

const eventAddAcceptedInvite = async (eventId, userId, userRelationshipStatus) => {
  const eventDoc = await getEvent(eventId);
  const { invitedUsers = {}, acceptedUsers = {}, declinedUsers = {} } = eventDoc;
  let { attendeedsInRelationship = 0 } = eventDoc;

  delete invitedUsers[userId];
  delete declinedUsers[userId];
  acceptedUsers[userId] = true;
  if (userUtils.isUserInRelationship(userRelationshipStatus)) {
    attendeedsInRelationship += 1;
  }

  return Event.findByIdAndUpdate(
    eventId,
    {
      invitedUsers,
      acceptedUsers,
      attendeedsInRelationship,
      declinedUsers
    },
    { new: true }
  );
};

const eventAddDeclinedInvite = async (eventId, userId) => {
  const eventDoc = await getEvent(eventId);
  const { invitedUsers = {}, acceptedUsers = {}, declinedUsers = {} } = eventDoc;

  delete invitedUsers[userId];
  delete acceptedUsers[userId];
  declinedUsers[userId] = true;

  return Event.findByIdAndUpdate(
    eventId,
    { invitedUsers, acceptedUsers, declinedUsers },
    { new: true }
  );
};

const searchEvents = async searchText =>
  // Event.find({ $text: { $search: searchText } })
  Event.find({ $and: [{ $text: { $search: searchText } }, { geo: { $ne: null } }] })
    .limit(20)
    .exec();

// Me
const blockUser = async (blockie, blocker, reason) => {
  if (!blocker.blocking) {
    blocker.blocking = {};
  }
  if (!blockie.blocking) {
    blockie.blocking = {};
  }

  if (!blockie.blocking.hideFrom) {
    blockie.blocking.hideFrom = {};
  }

  if (!blocker.blocking.block) {
    blocker.blocking.block = {};
  }

  blockie.blocking.hideFrom[blocker._id] = reason;
  blocker.blocking.block[blockie._id] = reason;

  try {
    await User.findByIdAndUpdate(blockie, { blocking: blockie.blocking }, { new: true });
    await User.findByIdAndUpdate(blocker, { blocking: blocker.blocking }, { new: true });
    return true;
  } catch (e) {
    bugsnagClient.notify(e);
    console.log(`error blocking user ${e}`);
    return false;
  }
};

const reportUser = async (blockie, blocker, reason) => {
  if (!blocker.reporting) {
    blocker.reporting = {};
  }
  if (!blockie.reporting) {
    blockie.reporting = {};
  }

  if (!blockie.reporting.recievedReport) {
    blockie.reporting.recievedReport = {};
  }

  if (!blocker.reporting.reported) {
    blocker.reporting.reported = {};
  }

  blockie.reporting.recievedReport[blocker._id] = reason;
  blocker.reporting.reported[blockie._id] = reason;

  try {
    await User.findByIdAndUpdate(blockie, { reporting: blockie.reporting }, { new: true });
    await User.findByIdAndUpdate(blocker, { reporting: blocker.reporting }, { new: true });
    return true;
  } catch (e) {
    bugsnagClient.notify(e);
    console.log(`error reporting user ${e}`);
    return false;
  }
};

const getMe = async id =>
  User.findById(id)
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .exec();

const updateEventOrder = async (userId, eventOrder, explore) => {
  return User.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        events: eventOrder
      }
    }
  );
};

const updateEventUsersStandings = async (eventId, userIds) => {
  return Event.findOneAndUpdate(
    { _id: eventId },
    {
      $set: {
        joinedUsers: userIds
      }
    }
  );
};

const updatePeopleOrder = async (userId, peopleOrder, explore) => {
  return User.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        people: peopleOrder
      }
    }
  );
};
const modifyMeInDbWithGeo = async (id, userUpdateItem) =>
  User.findOneAndUpdate(
    { fbId: id },
    {
      $set: {
        name: userUpdateItem.name,
        profilePic: userUpdateItem.profilePic,
        photos: userUpdateItem.photos,
        relationshipStatus: userUpdateItem.relationshipStatus,
        location: userUpdateItem.location,
        age: userUpdateItem.age,
        description: userUpdateItem.description,
        sexPreference: userUpdateItem.sexPreference,
        readNotifications: userUpdateItem.readNotifications,
        unreadNotifications: userUpdateItem.unreadNotifications,
        agePref: userUpdateItem.agePref,
        relationshipPref: userUpdateItem.relationshipPref,
        geo: {
          type: 'Point',
          coordinates: [userUpdateItem.location.longitude, userUpdateItem.location.latitude]
        }
      }
    },
    { new: true }
  )
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .exec();

const modifyMeInDb = async (id, userUpdateItem) =>
  User.findOneAndUpdate(
    { fbId: id },
    {
      $set: {
        name: userUpdateItem.name,
        profilePic: userUpdateItem.profilePic,
        photos: userUpdateItem.photos,
        relationshipStatus: userUpdateItem.relationshipStatus,
        location: userUpdateItem.location,
        age: userUpdateItem.age,
        description: userUpdateItem.description,
        sexPreference: userUpdateItem.sexPreference,
        readNotifications: userUpdateItem.readNotifications,
        unreadNotifications: userUpdateItem.unreadNotifications,
        agePref: userUpdateItem.agePref,
        relationshipPref: userUpdateItem.relationshipPref
      }
    },
    { new: true }
  )
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .exec();

const modifyExplore = async (id, user) => {
  return User.findOneAndUpdate(
    { fbId: id },
    {
      $set: {
        exploreIndexs: user.exploreIndexs
      }
    },
    { new: true }
  ).exec();
};

const modifyAttendance = async (id, user) => {
  return User.findOneAndUpdate(
    { fbId: id },
    {
      $set: {
        joinedEvents: user.joinedEvents
      }
    },
    { new: true }
  ).exec();
};

const modifyRating = async (id, user) => {
  return User.findOneAndUpdate(
    { fbId: id },
    {
      $set: {
        rating: user.rating
      }
    },
    { new: true }
  ).exec();
};

const userHasRated = async user => {
  return User.findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        rating: user.rating
      }
    },
    { new: true }
  ).exec();
};

const updateSocketId = async (fbId, updatedSocket) =>
  User.findOneAndUpdate(
    { fbId },
    {
      $set: {
        socket: updatedSocket
      }
    },
    { new: true }
  ).exec();

const saveMeToDb = async userItem => {
  const user = new User(userItem);
  // const success = await user.save();
  const success = await User.insertMany(user);
  if (success) {
    return user;
  }
  throw new Error('Failed to save user');
};

// Users
const getUser = async id =>
  User.findById(id, '-chats')
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .exec();

const getUserWithoutPopulate = async id => User.findById(id, '-chats');

const getUsers = async userIds =>
  User.find({
    _id: { $in: userIds }
  })
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .sort({ 'rating.ratingSum': -1 })
    .exec();

const getEvents = async eventIds =>
  Event.find({
    _id: { $in: eventIds }
  }).exec();

const getUsersByFbId = async userIds =>
  User.find({
    fbId: { $in: userIds }
  }).exec();

const searchUsers = async searchText =>
  User.find({ $text: { $search: searchText } })
    .limit(20)
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .exec();

const verifyUser = async fbId =>
  User.findOne({ fbId })
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .exec()
    .catch(err => {
      throw new Error(`Failed to verify users ${err}`);
    });

const checkNotificationDuplicate = async (toUserId, fromUserId, eventId, type, message) => {
  return Notification.find({ user: fromUserId, event: eventId, type, message });
};

const createNotification = async (toUserId, fromUserId, eventId, type, message) => {
  console.log('create notification');
  const existingNotificaiton = await checkNotificationDuplicate(
    toUserId,
    fromUserId,
    eventId,
    type,
    message
  );
  console.log('existing notification: ', existingNotificaiton);
  if (existingNotificaiton.length > 0) {
    return null;
  }
  const notification = new Notification({
    event: eventId,
    user: fromUserId,
    isSelfInvited: toUserId === fromUserId,
    alertedAt: moment(),
    type,
    message
  });
  console.log('new notification: ', notification);
  return notification.save();
};

const userAddNotification = async (userId, fromUserId, eventId, type, message) => {
  console.log('userAddNotification userId: ', userId, 'type: ', type);
  const userDoc = await getUser(userId);
  // console.log('userDoc', userDoc);
  const { unreadNotifications = [] } = userDoc;
  let note = '';
  if (message) {
    note = message;
  }

  const newNotificaiton = await createNotification(userId, fromUserId, eventId, type, note);
  if (newNotificaiton) {
    unreadNotifications.push(newNotificaiton);
  }

  return User.findByIdAndUpdate(userId, { unreadNotifications }, { new: true });
};

const removeNotification = async (userId, notificationId) => {
  const userDoc = await getUser(userId);
  const { readNotifications = [] } = userDoc;
  for (let i = 0; i < readNotifications.length; i++) {
    if (readNotifications[i]._id.toString() === notificationId.toString()) {
      console.log('notification match');
      readNotifications.splice(i, 1);
      return User.findByIdAndUpdate(userId, { readNotifications }, { new: true });
    }
  }
};

const userAddJoinedEvent = async (userId, eventId) => {
  const userDoc = await getUser(userId);
  const { joinedEvents = {}, pendingEventInvites = {} } = userDoc;
  joinedEvents[eventId] = true;
  delete pendingEventInvites[eventId];

  return User.findByIdAndUpdate(userId, { joinedEvents, pendingEventInvites }, { new: true });
};

const userLeaveJoinedEvent = async (userId, eventId) => {
  const userDoc = await getUser(userId);
  const { joinedEvents = {}, pendingEventInvites = {} } = userDoc;
  delete joinedEvents[eventId];
  delete pendingEventInvites[eventId];

  return User.findByIdAndUpdate(userId, { joinedEvents, pendingEventInvites }, { new: true });
};

const eventAddJoinedUser = async (eventId, userId, userRelationshipStatus) => {
  const eventDoc = await getEvent(eventId);
  const { joinedUsers = {}, joinRequests = {} } = eventDoc;
  let { attendeedsInRelationship = 0, attendeedsSingle = 0, attendeedsMarried = 0 } = eventDoc;
  delete joinRequests[userId];
  joinedUsers[userId] = true;

  // if (!userUtils.isUserInRelationship(userRelationshipStatus)) {
  //   attendeedsInRelationship += 1;
  // }

  if (userRelationshipStatus === 'Taken') {
    attendeedsInRelationship += 1;
  } else if (userRelationshipStatus === 'Married') {
    attendeedsMarried += 1;
  } else if (userRelationshipStatus === 'Single') {
    attendeedsSingle += 1;
  } else {
    attendeedsSingle += 1;
  }

  return Event.findByIdAndUpdate(
    eventId,
    { joinedUsers, joinRequests, attendeedsInRelationship, attendeedsSingle, attendeedsMarried },
    { new: true }
  );
};

const eventAddUserJoinRequest = async (eventId, userId) => {
  const eventDoc = await getEvent(eventId);
  const { joinRequests = {} } = eventDoc;
  joinRequests[userId] = true;

  return Event.findByIdAndUpdate(eventId, { joinRequests }, { new: true });
};

const eventDeclineJoinRequest = async (eventId, userId) => {
  const eventDoc = await getEvent(eventId);
  const { joinRequests = {}, joinedUsers = {} } = eventDoc;
  delete joinRequests[userId];
  delete joinedUsers[userId];

  return Event.findByIdAndUpdate(eventId, { joinRequests, joinedUsers }, { new: true });
};

const eventRemoveJoinedUser = async (eventId, userId, userRelationshipStatus) => {
  const eventDoc = await getEvent(eventId);
  const { joinedUsers = {} } = eventDoc;
  let { attendeedsInRelationship = 0 } = eventDoc;
  delete joinedUsers[userId];

  if (userUtils.isUserInRelationship(userRelationshipStatus)) {
    attendeedsInRelationship -= 1;
  }

  User.findByIdAndUpdate(userId, { joinedUsers, attendeedsInRelationship }, { new: true });
  return Event.findByIdAndUpdate(eventId, { joinedUsers }, { new: true });
};

const userAddPendingInvite = async (toUserId, fromUserId, eventId) => {
  const userDoc = await getUser(toUserId);
  const { pendingEventInvites = {}, unreadNotifications = [] } = userDoc;
  pendingEventInvites[eventId] = true;

  const newNotification = await createNotification(toUserId, fromUserId, eventId, 'invite');
  if (newNotification) {
    unreadNotifications.push(newNotification);
  }

  return User.findByIdAndUpdate(
    toUserId,
    { pendingEventInvites, unreadNotifications },
    { new: true }
  );
};

const userAddAcceptedInvite = async (userId, eventId) => {
  const userDoc = await getUser(userId);
  const {
    pendingEventInvites = {},
    acceptedEventInvites = {},
    declinedEventInvites = {}
  } = userDoc;

  delete pendingEventInvites[eventId];
  delete declinedEventInvites[eventId];
  acceptedEventInvites[eventId] = true;

  return User.findByIdAndUpdate(
    userId,
    { pendingEventInvites, acceptedEventInvites, declinedEventInvites },
    { new: true }
  );
};

const userAddDeclinedInvite = async (userId, eventId) => {
  const userDoc = await getUser(userId);
  const {
    pendingEventInvites = {},
    acceptedEventInvites = {},
    declinedEventInvites = {}
  } = userDoc;

  delete pendingEventInvites[eventId];
  delete acceptedEventInvites[eventId];
  declinedEventInvites[eventId] = true;

  return User.findByIdAndUpdate(
    userId,
    { pendingEventInvites, acceptedEventInvites, declinedEventInvites },
    { new: true }
  );
};

// chat stuff

const getChats = async chatIds => {
  if (chatIds.length > 0) {
    const mongooseChatsIds = chatIds.map(chatId => new mongoose.Types.ObjectId(chatId));
    return Chat.find({ _id: { $in: mongooseChatsIds } });
  }

  return null;
};

const createChat = async (user, reciever) => {
  const newChat = {
    users: [user.fbId, reciever.fbId],
    usersImageUri: [user.profilePic, reciever.profilePic],
    usersNames: [user.name, reciever.name],
    messages: []
  };
  const chat = new Chat(newChat);
  return chat.save();
};

const saveChat = async (user, chats) => User.findByIdAndUpdate(user._id, { chats }, { new: true });

// this only updates messages and lastestTime, no need to change anything else
const updateChat = async chatData =>
  Chat.findByIdAndUpdate(
    chatData._id,
    {
      messages: chatData.messages,
      latestTime: chatData.latestTime
    },
    { new: true }
  );

const updateReadStatus = async (chatId, messages) =>
  Chat.findByIdAndUpdate(
    chatId,
    {
      messages
    },
    { new: true }
  );

// Messages
const getMessages = async messageIds => {
  const mongooseMessageIds = messageIds.map(messageId => new mongoose.Types.ObjectId(messageId));

  return Message.find({ _id: { $in: mongooseMessageIds } });
};

const saveMessageToDb = async messageItem => {
  const message = new Message(messageItem);
  return message.save();
};

const deleteMessage = async messageId => Message.remove({ _id: messageId });

// people stuff

const getPeopleByCity = async (city, exlcuded) =>
  User.find({
    //'location.addressComponents.locality': city
    $and: [{ 'location.addressComponents.locality': city }, { _id: { $nin: exlcuded } }]
  })
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .exec();

// the second param is optional and exludes people who live in the passed city
const getPeopleByState = async (state, city) => {
  if (city) {
    return User.find({
      $and: [
        { 'location.addressComponents.administrative_area_level_1': state },
        { 'location.addressComponents.locality': { $ne: city } }
      ]
    })
      .populate({
        path: 'unreadNotifications readNotifications',
        model: 'Notification',
        populate: [
          {
            path: 'event',
            model: 'Event'
          },
          {
            path: 'user',
            model: 'User'
          }
        ]
      })
      .exec();
  }
  return User.find({
    'location.addressComponents.administrative_area_level_1': state
  })
    .populate({
      path: 'unreadNotifications readNotifications',
      model: 'Notification',
      populate: [
        {
          path: 'event',
          model: 'Event'
        },
        {
          path: 'user',
          model: 'User'
        }
      ]
    })
    .exec();
};

const deleteEvent = async eventId => {
  return Event.remove({ _id: eventId });
};

const deleteProfile = async userId => {
  try {
    return User.deleteOne({ fbId: userId });
  } catch (e) {
    bugsnagClient.notify(e);
    console.log(e);
  }
};

const blahMaker = async stuff => {
  const newStuff = new Blah({ random: stuff });
  newStuff.save();
};

const blahGetter = async blahId => {
  return Blah.findById(blahId);
};

const blahUpdater = async (blahId, blahList) => {
  return Blah.findByIdAndUpdate(blahId, { random: blahList }, { new: true });
};

module.exports = {
  getEventCount,
  getUserCount,
  getNotificationCount,
  blahMaker,
  blahGetter,
  blahUpdater,
  getEvent,
  getEvents,
  getAllEvents,
  getMyEvents,
  modifyEventInDb,
  saveEventToDb,
  eventAddPendingInvite,
  eventAddAcceptedInvite,
  eventAddDeclinedInvite,
  eventAddJoinedUser,
  eventAddUserJoinRequest,
  eventDeclineJoinRequest,
  eventRemoveJoinedUser,
  createNotification,
  userAddNotification,
  removeNotification,
  userAddJoinedEvent,
  userLeaveJoinedEvent,
  searchEvents,
  getMe,
  getUsers,
  searchUsers,
  modifyMeInDb,
  saveMeToDb,
  getUser,
  getUserWithoutPopulate,
  verifyUser,
  userAddPendingInvite,
  userAddAcceptedInvite,
  userAddDeclinedInvite,
  getMessages,
  deleteMessage,
  saveMessageToDb,
  getPeopleByCity,
  getPeopleByState,
  getChats,
  createChat,
  saveChat,
  updateSocketId,
  updateChat,
  getUsersByFbId,
  updateReadStatus,
  getEventsByCity,
  getEventsByState,
  getAttendingEvents,
  modifyExplore,
  modifyAttendance,
  modifyRating,
  userHasRated,
  blockUser,
  reportUser,
  getEventsViaGeo,
  updateEventOrder,
  getPeopleViaGeo,
  updatePeopleOrder,
  getAttendingPeople,
  getEventsViaGeoAndPref,
  deleteEvent,
  deleteProfile,
  modifyMeInDbWithGeo,
  getPeopleViaGeoAndPref,
  updateEventUsersStandings
};
