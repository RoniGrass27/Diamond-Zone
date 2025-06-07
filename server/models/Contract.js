const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MemoFrom', 'Buy', 'Sell'], // Removed 'MemoTo'
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
  // Email addresses based on contract type:
  // MemoFrom: buyerEmail = recipient, sellerEmail = current user
  // Buy: buyerEmail = current user, sellerEmail = diamond owner  
  // Sell: buyerEmail = potential buyer, sellerEmail = current user
  buyerEmail: {
    type: String,
    required: true
  },
  sellerEmail: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: function() {
      return this.type === 'Buy' || this.type === 'Sell';
    }
  },
  expirationDate: {
    type: Date,
    required: true
  },
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
  // Fields specific to MemoFrom contracts
  duration: {
    type: Number, // in days
    required: function() {
      return this.type === 'MemoFrom';
    },
    default: function() {
      return this.type === 'MemoFrom' ? 30 : undefined;
    }
  },
  terms: {
    type: String,
    default: '',
    required: function() {
      return this.type === 'MemoFrom';
    }
  },
  // Blockchain related fields
  blockchain_enabled: {
    type: Boolean,
    default: false
  },
  wallet_address: String,
  blockchain_transaction_hash: String,
  blockchain_loan_id: Number,
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

// Method to get the counterparty email based on current user
ContractSchema.methods.getCounterpartyEmail = function(currentUserEmail) {
  if (this.type === 'MemoFrom') {
    // For MemoFrom, if current user is seller, counterparty is buyer
    return currentUserEmail === this.sellerEmail ? this.buyerEmail : this.sellerEmail;
  } else if (this.type === 'Buy') {
    // For Buy, if current user is buyer, counterparty is seller
    return currentUserEmail === this.buyerEmail ? this.sellerEmail : this.buyerEmail;
  } else if (this.type === 'Sell') {
    // For Sell, if current user is seller, counterparty is buyer
    return currentUserEmail === this.sellerEmail ? this.buyerEmail : this.sellerEmail;
  }
  return null;
};

// Method to check if current user can approve this contract
ContractSchema.methods.canApprove = function(currentUserEmail) {
  if (this.type === 'MemoFrom') {
    // Recipient (buyer) can approve memo from requests
    return this.buyerEmail === currentUserEmail;
  } else if (this.type === 'Buy') {
    // Seller can approve buy requests
    return this.sellerEmail === currentUserEmail;
  } else if (this.type === 'Sell') {
    // Buyer can approve sell offers
    return this.buyerEmail === currentUserEmail;
  }
  return false;
};

// Method to get display info for the contract
ContractSchema.methods.getDisplayInfo = function(currentUserEmail) {
  let direction = '';
  let counterparty = '';
  
  if (this.type === 'MemoFrom') {
    if (this.sellerEmail === currentUserEmail) {
      direction = 'Memo To';
      counterparty = this.buyerEmail;
    } else {
      direction = 'Memo From';
      counterparty = this.sellerEmail;
    }
  } else if (this.type === 'Buy') {
    if (this.buyerEmail === currentUserEmail) {
      direction = 'Buying From';
      counterparty = this.sellerEmail;
    } else {
      direction = 'Sell To';
      counterparty = this.buyerEmail;
    }
  } else if (this.type === 'Sell') {
    if (this.sellerEmail === currentUserEmail) {
      direction = 'Selling To';
      counterparty = this.buyerEmail;
    } else {
      direction = 'Buy From';
      counterparty = this.sellerEmail;
    }
  }
  
  return {
    direction,
    counterparty,
    isInitiator: this.ownerId.toString() === currentUserEmail // Note: this compares ObjectId with email, needs adjustment
  };
};

const Contract = mongoose.model('Contract', ContractSchema);

module.exports = { Contract };