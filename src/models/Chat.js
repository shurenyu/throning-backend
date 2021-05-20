const mongoose = require('mongoose');

const { Schema } = mongoose;
const ChatSchema = new Schema({
  users: { type: Array, defult: null },
  usersImageUri: { type: Array, default: null },
  usersNames: { type: Array, default: null },
  latestTime: { type: Date, defult: null },
  messages: { type: Array, defult: null }
});

module.exports = mongoose.model('Chat', ChatSchema);
