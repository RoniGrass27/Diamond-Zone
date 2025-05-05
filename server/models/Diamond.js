const mongoose = require('mongoose');

const DiamondSchema = new mongoose.Schema({
  shape: String,
  carat: Number,
  color: String,
  clarity: String,
  price: Number,
  name: String,
  cut: String,
  polish: String,
  symmetry: String,
  uv: String,
  status: String
});

const Diamond = mongoose.model('Diamond', DiamondSchema);

module.exports = { Diamond };
