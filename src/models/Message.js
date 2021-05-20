const mongoose = require('mongoose');

const { Schema } = mongoose;
const MessageSchema = new Schema({
  eventId: { type: String, default: null },
  userId: { type: String, defult: null },
  userImageUri: { type: String, default: null },
  userName: { type: String, default: null },
  createdTime: { type: Date, defult: null },
  text: { type: String, defult: null }
});

module.exports = mongoose.model('Message', MessageSchema);
