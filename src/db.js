const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const setupDb = () => {
  const mongoDb = 'mongodb://api:Password1@cluster1-shard-00-00.feytm.mongodb.net:27017,cluster1-shard-00-01.feytm.mongodb.net:27017,cluster1-shard-00-02.feytm.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-ybn93f-shard-0&authSource=admin&retryWrites=true&w=majority'

  mongoose.connect(mongoDb);
  const db = mongoose.connection;

  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => {
    console.log('Connected to DB!');
  });
};

module.exports = {
  setupDb
};
