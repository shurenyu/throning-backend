const eventController = require('../controllers/eventController');

module.exports = app => {
  app
    .route('/api/events')
    .post(eventController.eventReceived)
    .get(eventController.getEvents);

  app.route('/api/events/delete').post(eventController.deleteEvent);
  app.route('/api/my-events').post(eventController.getMyEvents);
  app.route('/api/get-events').post(eventController.getEventsV2);
  app.route('/api/events/join').post(eventController.joinEvent);
  app.route('/api/events/join/request').post(eventController.eventCreateJoinRequest);
  app.route('/api/events/join/request/approve').post(eventController.eventApproveJoinRequest);
  app.route('/api/events/join/request/decline').post(eventController.eventDeclineJoinRequest);
  app.route('/api/events/leave').post(eventController.leaveEvent);

  app.route('/api/events/:eventId').put(eventController.updateEventReceived);
  app.route('/api/events/search').get(eventController.eventSearch);
  app.route('/api/events/get-photos').get(eventController.getEventPhotos);
  app.route('/api/events/upload').post(eventController.uploadImage);

  app.route('/api/events/retrieve-events').post(eventController.retrieveEvents);
  app.route('/api/print').post(eventController.printShit);
  app.route('/api/events/update-attendance').post(eventController.updateAttendance);
  app.route('/api/events/update-relationship-stats').post(eventController.updateRelationshipData);
};
