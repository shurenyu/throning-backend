const dbUtils = require('../../utils/dbUtils');
const bugsnag = require('@bugsnag/js');
const bugsnagExpress = require('@bugsnag/plugin-express');
const bugsnagClient = bugsnag('26ef4241b9b5c6bf255f5c54c6ae144d');
bugsnagClient.use(bugsnagExpress);

const retrieveByLocation = async (req, res) => {
  const user = req.body.user;
  const location = req.body.location;
  let userPeople = user.people;
  const blocked = req.body.user.blocking.hideFrom;
  let blockedKeys = [];
  if (blocked) {
    blockedKeys = Object.keys(blocked);
  }
  blockedKeys.push(req.body.user._id);
  let closePeople = await dbUtils.getPeopleViaGeo(user.location, blockedKeys);

  try {
    if (closePeople.length !== userPeople.length) {
      if (!user.exploreIndexs) {
        user.exploreIndexs = {};
      }
      if (!user.exploreIndexs.people) {
        user.exploreIndexs.people = {};
      }

      let peopleIndex = user.exploreIndexs.people[location.addressComponents.locality];
      // console.log(peopleIndex);
      if (!peopleIndex || peopleIndex === null) {
        peopleIndex = 1;
        for (let x = 0; x < closePeople.length; x++) {
          userPeople.push(closePeople[x]._id);
        }
      } else {
        for (let x = 0; x < closePeople.length; x++) {
          if (userPeople.indexOf(closePeople[x]._id) < 0) {
            userPeople.splice(peopleIndex, 0, closePeople[x]._id);
            peopleIndex++;
          }
        }
      }
      user.exploreIndexs.people[location.addressComponents.locality] = peopleIndex;
      await dbUtils.updatePeopleOrder(user._id, userPeople, user.exploreIndexs);
      await dbUtils.modifyExplore(user.fbId, user);
    }
    closePeople = await dbUtils.getAttendingPeople(userPeople);
    res.status = 200;
    res.send({ success: true, people: closePeople });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log('error in getting people');
    console.log('caught ' + err);
    res.status = 200;
    res.send({ success: false });
  }
};

const retrieveByLocationV2 = async (req, res) => {
  const { user, location } = req.body;
  let userPeople = user.people;
  const blocked = req.body.user.blocking.hideFrom;
  let excluded = [];
  let tierOne = [];
  let tierTwo = [];
  let tierThree = [];
  let tierFour = [];
  let closePeople;

  // blocking
  if (blocked) {
    excluded = Object.keys(blocked);
  }
  excluded.push(req.body.user._id);

  tierOne = await dbUtils.getPeopleViaGeoAndPref(
    location,
    excluded,
    user.agePref,
    user.relationshipPref,
    0
  );

  tierTwo = await dbUtils.getPeopleViaGeoAndPref(
    location,
    excluded,
    user.agePref,
    user.relationshipPref,
    40233.6
  );

  tierThree = await dbUtils.getPeopleViaGeoAndPref(
    location,
    excluded,
    user.agePref,
    user.relationshipPref,
    80467.2
  );

  tierFour = await dbUtils.getPeopleViaGeoAndPref(
    location,
    excluded,
    user.agePref,
    user.relationshipPref,
    120701
  );

  closePeople = tierOne.concat(tierTwo);
  closePeople = closePeople.concat(tierThree);
  closePeople = closePeople.concat(tierFour);

  try {
    if (closePeople.length !== userPeople.length) {
      if (!user.exploreIndexs) {
        user.exploreIndexs = {};
      }
      if (!user.exploreIndexs.people) {
        user.exploreIndexs.people = {};
      }

      let peopleIndex = user.exploreIndexs.people[location.addressComponents.locality];
      // console.log(peopleIndex);
      if (!peopleIndex || peopleIndex === null) {
        peopleIndex = 1;
        for (let x = 0; x < closePeople.length; x++) {
          userPeople.push(closePeople[x]._id);
        }
      } else {
        for (let x = 0; x < closePeople.length; x++) {
          if (userPeople.indexOf(closePeople[x]._id) < 0) {
            userPeople.splice(peopleIndex, 0, closePeople[x]._id);
            peopleIndex++;
          }
        }
      }

      if (peopleIndex > closePeople.length) {
        peopleIndex = closePeople.length;
      }

      if (userPeople.length > closePeople.length) {
        userPeople = userPeople.slice(0, closePeople.length);
      }

      user.exploreIndexs.people[location.addressComponents.locality] = peopleIndex;
      await dbUtils.updatePeopleOrder(user._id, userPeople, user.exploreIndexs);
      await dbUtils.modifyExplore(user.fbId, user);
    }
    res.status = 200;
    res.send({ success: true, people: closePeople });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log('error in getting people');
    console.log('caught ' + err);
    res.status = 200;
    res.send({ success: false });
  }
};

const updateEventStandings = async eventIds => {
  console.log('updating event standings');
  const events = await dbUtils.getEvents(eventIds);
  await Promise.all(
    events.map(async event => {
      const userIds = Object.keys(event.joinedUsers);
      const users = await dbUtils.getUsers(userIds);
      users.sort((a, b) => {
        return b.rating.ratingSum - a.rating.ratingSum;
      });
      const userKeys = {};
      for (let x = 0; x < users.length; x++) {
        userKeys[users[x]._id] = true;
      }
      await dbUtils.updateEventUsersStandings(event._id, userKeys);
      //console.log('updateSuccess: ', updateSuccess);
    })
  );
};

// updateEventStandings('5c11b00bc2e2fe1ed69bdd52');

const updateUserStandings = async (eventIds, userId) => {
  const events = await dbUtils.getEvents(eventIds);
  await Promise.all(
    events.map(async event => {
      const userIds = Object.keys(event.joinedUsers);
      const users = await dbUtils.getUsers(userIds);
      const oldKing = users[0]._id;
      users.sort((a, b) => {
        return b.rating.ratingSum - a.rating.ratingSum;
      });
      const userKeys = {};
      for (let x = 0; x < users.length; x++) {
        userKeys[users[x]._id] = true;
      }
      await dbUtils.updateEventUsersStandings(event._id, userKeys);
      if (userId.toString() === oldKing.toString() || oldKing !== users[0]._id) {
        dbUtils.userAddNotification(
          users[0]._id,
          users[0]._id,
          event._id,
          'king',
          'You are now King'
        );
      }
    })
  );
};

const updateRating = async (req, res) => {
  const { user, newRating, raterId, eventId } = req.body;
  try {
    user.rating.ratingSum += newRating;

    const updatedUser = await dbUtils.modifyRating(user.fbId, user);
    dbUtils.userAddNotification(user._id, raterId, eventId, 'rating', newRating.toString());
    res.status = 200;
    res.send({ success: true, user: updatedUser });
    const eventKeys = Object.keys(user.joinedEvents);
    updateUserStandings(eventKeys);
  } catch (e) {
    bugsnagClient.notify(e);
    console.log('error with updating user rating ' + e);
  }
};

const userHasRated = async (req, res) => {
  const { user } = req.body;
  try {
    dbUtils.userHasRated(user);
    res.send({ success: true });
  } catch (e) {
    bugsnagClient.notify(e);
    res.send({ success: false });
    console.log(e);
  }
};

// const updateRating = async (req, res) => {
//   const { user, newRating, raterId } = req.body;
//   console.log('attempting to update user rating');
//   console.log(user.rating);
//   try {
//     if (!user.rating.raters) {
//       user.rating.raters = {};
//     }
//     if (user.rating.raters[raterId]) {
//       user.rating.ratingSum -= user.rating.raters[raterId];
//       user.rating.raters[raterId] = newRating;
//     } else {
//       user.rating.raters[raterId] = newRating;
//       user.rating.numberOfRaters++;
//     }

//     user.rating.ratingSum += newRating;
//     user.rating.currentRating = Math.round(user.rating.ratingSum / user.rating.numberOfRaters);

//     const updatedUser = await dbUtils.modifyRating(user.fbId, user);

//     res.status = 200;
//     res.send({ success: true, user: updatedUser });
//   } catch (e) {
//bugsnagClient.notify(e);
//     console.log('error with updating user rating ' + e);
//   }
// };

module.exports = {
  retrieveByLocation,
  updateRating,
  retrieveByLocationV2,
  updateUserStandings,
  userHasRated,
  updateEventStandings
};
