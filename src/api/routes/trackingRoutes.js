const trackingController = require('../controllers/trackingController');
const path = require('path');
const bugsnag = require('@bugsnag/js');
const bugsnagExpress = require('@bugsnag/plugin-express');
const bugsnagClient = bugsnag('26ef4241b9b5c6bf255f5c54c6ae144d');
bugsnagClient.use(bugsnagExpress);

module.exports = app => {
  app.route('/terms').get((req, res) => {
    res.sendFile(path.join(__dirname, '../../static/terms.html'));
  });
  app.route('/privacy-policy').get((req, res) => {
    res.sendFile(path.join(__dirname, '../../static/privacy.html'));
  });
  app.route('/dashboard').get((req, res) => {
    res.sendFile(path.join(__dirname, '../../static/Dashboard.html'));
  });
  app.route('/api/get-app-stats').get(trackingController.getAppStats);
  app.route('/api/trigger-bug').get((req, res) => {
    bugsnagClient.notify(new Error({ 'test-error': true }));
    res.send({ 'success': 'true' });
  });
};
