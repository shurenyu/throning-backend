const mongoose = require('mongoose');

const { Schema } = mongoose;
const NotificationSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  isSelfInvited: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ['invite', 'joinRequest', 'acceptedJoinRequest', 'rating', 'coHost', 'king'],
    default: 'invite'
  },
  alertedAt: { type: String },
  message: { type: String, default: null }
});

module.exports = mongoose.model('Notification', NotificationSchema);
