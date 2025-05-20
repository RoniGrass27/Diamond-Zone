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
    enum: ['pending', 'approved', 'returned'],
    default: 'pending'
  },
  contractNumber: {
  type: Number,
  required: true,
  unique: true
  }
});

const Contract = mongoose.model('Contract', ContractSchema);

module.exports = { Contract };

