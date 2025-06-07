const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MemoTo', 'MemoFrom', 'Buy', 'Sell'],
    required: true
  },
  diamondId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diamond',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrowerName: String,
  lenderName: String,
  buyerEmail: String,
  sellerEmail: String,
  price: Number,
  expirationDate: Date,
  createdDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'returned'],
    default: 'pending'
  },
  contractNumber: {
    type: Number,
    required: true,
    unique: true
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in days
    default: 30
  },
  terms: {
    type: String,
    default: ''
  },
  blockchain_enabled: {
    type: Boolean,
    default: false
  },
  wallet_address: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ContractSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Contract = mongoose.model('Contract', ContractSchema);

module.exports = { Contract };