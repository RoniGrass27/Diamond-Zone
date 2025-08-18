const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['contract_request', 'contract_approval', 'offer_notification', 'system_notification', 'return_request', 'return_approved'],
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    default: null
  },
  diamondId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diamond',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isActionRequired: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    enum: ['approve_contract', 'reject_contract', 'view_offer', 'none'],
    default: 'none'
  },
  metadata: {
    price: Number,
    expirationDate: Date,
    contractType: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date,
    default: null
  }
});

// Mark message as read
MessageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Get unread count for user
MessageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ toUser: userId, isRead: false });
};

const Message = mongoose.model('Message', MessageSchema);

module.exports = { Message };