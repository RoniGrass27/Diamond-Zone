const mongoose = require('mongoose');

const DiamondSchema = new mongoose.Schema({
  shape: String,
  carat: Number,
  color: String,
  clarity: String,
  price: Number,
  cut: String,
  polish: String,
  symmetry: String,
  uv: String,
  photo: String, // URL or file path to the diamond photo
  status: {
    type: String,
    enum: ['In Stock', 'Borrowed', 'Sold'],
    default: 'In Stock'
  },
  diamondNumber: {
    type: Number,
    required: true,
    unique: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
DiamondSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Diamond = mongoose.model('Diamond', DiamondSchema);

module.exports = { Diamond };