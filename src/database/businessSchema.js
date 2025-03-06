const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    type: {
      long: { type: String, required: true },
      lat: { type: String, required: true }
    },
    required: true
  },
  category: { type: String, required: true },
  image: { type: String, required: true },
  password: { type: String, required: true }
  // contact: { type: String, required: true },
  // featured: { type: Boolean, required: true },
});

const Business = mongoose.model('Business', businessSchema);
module.exports = Business;