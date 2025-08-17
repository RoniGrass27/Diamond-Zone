const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MemoFrom', 'MemoTo', 'Buy', 'Sell'],
    required: true
  },
  diamondId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diamond',
    required: true
  },
  // Store diamond information directly to avoid lookup issues
  diamondInfo: {
    diamondNumber: {
      type: Number,
      required: true
    },
    carat: Number,
    shape: String,
    color: String,
    clarity: String,
    cut: String,
    polish: String,
    symmetry: String,
    uv: String,
    price: Number,
    status: String
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  duration: {
    type: Number,
    required: function() {
      return this.type === 'MemoFrom' || this.type === 'MemoTo';
    },
    default: function() {
      return (this.type === 'MemoFrom' || this.type === 'MemoTo') ? 30 : undefined;
    }
  },
  terms: {
    type: String,
    default: '',
    required: false // Remove the required validation since we have a default value
  },
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
  if (this.type === 'MemoFrom' || this.type === 'MemoTo') {
    return currentUserEmail === this.sellerEmail ? this.buyerEmail : this.sellerEmail;
  } else if (this.type === 'Buy') {
    return currentUserEmail === this.buyerEmail ? this.sellerEmail : this.buyerEmail;
  } else if (this.type === 'Sell') {
    return currentUserEmail === this.sellerEmail ? this.buyerEmail : this.sellerEmail;
  }
  return null;
};

// Method to check if current user can approve this contract
ContractSchema.methods.canApprove = function(currentUserEmail) {
  if (this.type === 'MemoFrom') {
    // For MemoFrom: buyer approves (buyer is the one who will use the diamond)
    return this.buyerEmail === currentUserEmail;
  } else if (this.type === 'MemoTo') {
    // For MemoTo: seller approves (seller owns the diamond and must approve the lending)
    return this.sellerEmail === currentUserEmail;
  } else if (this.type === 'Buy') {
    return this.sellerEmail === currentUserEmail;
  } else if (this.type === 'Sell') {
    return this.buyerEmail === currentUserEmail;
  }
  return false;
};

// Method to get display info for the contract
ContractSchema.methods.getDisplayInfo = function(currentUserEmail) {
  let direction = '';
  let counterparty = '';
  
  if (this.type === 'MemoFrom' || this.type === 'MemoTo') {
    if (this.sellerEmail === currentUserEmail) {
      direction = 'Memo From'; // Seller sees "Memo From"
      counterparty = this.buyerEmail;
    } else {
      direction = 'Memo To'; // Buyer sees "Memo To"
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
    isInitiator: this.ownerId.toString() === currentUserEmail
  };
};

const Contract = mongoose.model('Contract', ContractSchema);

module.exports = { Contract };