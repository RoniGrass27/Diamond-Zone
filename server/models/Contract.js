const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  borrowerName: String,
  lenderName: String,
  diamondId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diamond'
  },
  date: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'returned'],
    default: 'pending'
  }
});

const Contract = mongoose.model('Contract', ContractSchema);

module.exports = { Contract };
