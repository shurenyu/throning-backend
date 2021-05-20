const mongoose = require('mongoose');

const { Schema } = mongoose;
const EventSchema = new Schema({
  title: { type: String, default: null },
  createdTime: { type: Date, default: Date.now() },
  imageUri: { type: String, default: null },
  location: { type: Object, default: null },
  description: { type: String, default: null },
  invitedUsers: { type: Object, default: {} },
  acceptedUsers: { type: Object, default: {} },
  attendeedsInRelationship: { type: Number, default: 0 },
  attendeedsSingle: { type: Number, default: 0 },
  attendeedsMarried: { type: Number, default: 0 },
  declinedUsers: { type: Object, default: {} },
  joinedUsers: { type: Object, default: {} },
  joinRequests: { type: Object, default: {} },
  host: { type: String, default: null },
  coHost: { type: Object, default: null },
  eventTime: { type: Object, default: null },
  date: { type: Object, default: null },
  ageRange: { type: Object, default: null },
  messageIds: { type: Array, default: [] },
  isPrivate: { type: Boolean, default: false },
  openInvite: { type: Boolean, default: true },
  relationshipPref: { type: String, default: true },
  images: { type: Array, default: [] },
  geo: { type: Object, default: [] }
});
EventSchema.index({ title: 'text' });
EventSchema.index({ geo: '2dsphere' });

module.exports = mongoose.model('Event', EventSchema);
