const mongoose = require('mongoose');

const { Schema } = mongoose;
const BlahSchema = new Schema({
  random: { type: Object, defult: null }
});

module.exports = mongoose.model('Blah', BlahSchema);
