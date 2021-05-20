require('dotenv').config(); // Setup environment variables
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const bodyParser = require('body-parser');
const PublicIp = require('public-ip');
const bugsnag = require('@bugsnag/js');
const bugsnagExpress = require('@bugsnag/plugin-express');
const http = require('http');
const db = require('./db');
const eventRoutes = require('./api/routes/eventRoutes');
const userRoutes = require('./api/routes/userRoutes');
const messageRoutes = require('./api/routes/messageRoutes');
const imageRoutes = require('./api/routes/imageRoutes');
const inviteRoutes = require('./api/routes/inviteRoutes');
const peopleRoutes = require('./api/routes/peopleRoutes');
const chatRoutes = require('./api/routes/chatRoutes');
const locationRoutes = require('./api/routes/locationRoutes');
const trackingRoutes = require('./api/routes/trackingRoutes');


const app = express();

//bug snag things
const bugsnagClient = bugsnag('26ef4241b9b5c6bf255f5c54c6ae144d');
bugsnagClient.use(bugsnagExpress);
const bugsnagMiddleware = bugsnagClient.getPlugin('express');

let myPublicIp;
const getPublicIp = () => {
  PublicIp.v4().then(ip => {
    console.log(`Public IP: ${ip}`);
    myPublicIp = ip;
  });
};

const normalizePort = val => {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

// This must be the first piece of middleware in the stack.
// It can only capture errors in downstream middleware
app.use(bugsnagMiddleware.requestHandler);

/* all other middleware and application routes go here */

app.use(
  session({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 24 * 60 * 60 * 1000 // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true
    }
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '5mb' })); // parse application/json

app.use((req, res, next) => {
  res.locals.myPublicIp = myPublicIp || '(Public IP has not been found)';
  if (!myPublicIp) {
    getPublicIp();
  }
  next();
});

// This handles any errors that Express catches
app.use(bugsnagMiddleware.errorHandler);

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
const server = http.createServer(app);
const io = require('socket.io')(server);

// api routes
eventRoutes(app);
userRoutes(app);
messageRoutes(app);
imageRoutes(app);
inviteRoutes(app, io);
peopleRoutes(app);
chatRoutes(app, io);
trackingRoutes(app);
locationRoutes(app);

// More graceful fallback
app.use((req, res) => {
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

getPublicIp();
db.setupDb();

server.listen(port);

module.exports = server;
