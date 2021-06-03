const mongoose = require('mongoose');

const { Schema } = mongoose;
const UserSchema = new Schema({
  email: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  loginType: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  fbId: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    default: ''
  },
  profilePic: {
    type: String,
    default: ''
  },
  blocking: {
    type: Object,
    default: null
  },
  reporting: {
    type: Object,
    default: null
  },
  relationshipStatus: { type: String, default: null },
  location: {
    type: Object,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  photos: {
    type: Array,
    default: false
  },
  events: {
    type: Array,
    default: null
  },
  people: {
    type: Array,
    default: null
  },
  exploreIndexs: { type: Object, default: {} },
  relationshipPref: {
    type: String,
    default: null
  },
  agePref: {
    type: Object,
    default: null
  },
  recentInteractions: {
    type: Array,
    default: null
  },
  rating: {
    type: Object,
    default: null
  },
  readNotifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  unreadNotifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  sexPreference: {
    type: String,
    default: null
  },
  acceptedEventInvites: { type: Object, default: {} },
  pendingEventInvites: { type: Object, default: {} },
  declinedEventInvites: { type: Object, default: {} },
  joinedEvents: { type: Object, default: {} },
  socket: {
    type: Object,
    default: {
      id: null,
      connected: false
    }
  },
  geo: { type: Object, default: null },
  chats: {
    type: Array,
    default: null
  } //We can store the chat IDs here, have a separate chat endpoint to grab the content
});
UserSchema.index({ name: 'text' });
UserSchema.index({ geo: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
