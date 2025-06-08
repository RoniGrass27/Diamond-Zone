const express = require('express');
const { Message } = require('../models/Message');
const { User } = require('../models/User');
const { Contract } = require('../models/Contract');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all messages for current user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { toUser: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const messages = await Message.find(query)
      .populate('fromUser', 'fullName businessName email')
      .populate('contractId', 'contractNumber type status')
      .populate('diamondId', 'diamondNumber carat')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user._id);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error getting unread count' });
  }
});

// Mark message as read
router.post('/:messageId/read', async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      toUser: req.user._id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.isRead) {
      await message.markAsRead();
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Server error marking message as read' });
  }
});

// Mark all messages as read
router.post('/mark-all-read', async (req, res) => {
  try {
    await Message.updateMany(
      { toUser: req.user._id, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      message: 'All messages marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Server error marking all messages as read' });
  }
});

// Send a message (for system notifications, contract requests, etc.)
router.post('/send', async (req, res) => {
  try {
    const { 
      toUserEmail, 
      type, 
      title, 
      content, 
      contractId, 
      diamondId, 
      isActionRequired = false,
      actionType = 'none',
      metadata = {}
    } = req.body;

    // Find recipient by email
    const toUser = await User.findOne({ email: toUserEmail.toLowerCase() });
    if (!toUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create message
    const message = new Message({
      type,
      fromUser: req.user._id,
      toUser: toUser._id,
      title,
      content,
      contractId,
      diamondId,
      isActionRequired,
      actionType,
      metadata
    });

    await message.save();

    // Populate the message for response
    await message.populate('fromUser', 'fullName businessName email');
    await message.populate('toUser', 'fullName businessName email');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      toUser: req.user._id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error deleting message' });
  }
});

// Helper function to create contract request message
const createContractRequestMessage = async (fromUserId, toUserEmail, contractId, contractData) => {
  try {
    console.log('=== Creating Contract Request Message ===');
    console.log('From user ID:', fromUserId);
    console.log('To user email:', toUserEmail);
    console.log('Contract ID:', contractId);
    console.log('Contract data:', contractData);
    
    const toUser = await User.findOne({ email: toUserEmail.toLowerCase() });
    if (!toUser) {
      throw new Error('Recipient not found');
    }
    console.log('✅ Recipient found:', toUser.email);

    const fromUser = await User.findById(fromUserId);
    if (!fromUser) {
      throw new Error('Sender not found');
    }
    console.log('✅ Sender found:', fromUser.email);
    
    // Format diamond number display
    const diamondDisplay = contractData.diamondNumber 
      ? `#${String(contractData.diamondNumber).padStart(3, '0')}` 
      : 'N/A';
    
    const message = new Message({
      type: 'contract_request',
      fromUser: fromUserId,
      toUser: toUser._id,
      title: `New ${contractData.type} Contract Request`,
      content: `${fromUser.fullName /*|| fromUser.businessName*/} has sent you a ${contractData.type.toLowerCase()} contract request for diamond ${diamondDisplay}`,
      contractId: contractId,
      diamondId: contractData.diamondId,
      isActionRequired: true,
      actionType: 'approve_contract',
      metadata: {
        price: contractData.price,
        expirationDate: contractData.expirationDate,
        contractType: contractData.type,
        duration: contractData.duration,
        terms: contractData.terms,
        diamondNumber: contractData.diamondNumber,
        priority: 'high'
      }
    });

    await message.save();
    console.log('✅ Message saved with ID:', message._id);
    console.log('✅ Message contractId:', message.contractId);
    
    return message;
  } catch (error) {
    console.error('❌ Error creating contract request message:', error);
    throw error;
  }
};

// Helper function to create offer notification message
const createOfferNotificationMessage = async (fromUserId, toUserId, contractId, offerData) => {
  try {
    const fromUser = await User.findById(fromUserId);
    
    const message = new Message({
      type: 'offer_notification',
      fromUser: fromUserId,
      toUser: toUserId,
      title: 'New Offer Received',
      content: `${fromUser.businessName} has made an offer of $${offerData.amount.toLocaleString()} on your diamond`,
      contractId: contractId,
      diamondId: offerData.diamondId,
      isActionRequired: true,
      actionType: 'view_offer',
      metadata: {
        price: offerData.amount,
        priority: 'medium'
      }
    });

    await message.save();
    return message;
  } catch (error) {
    console.error('Error creating offer notification message:', error);
    throw error;
  }
};

module.exports = {
  router,
  createContractRequestMessage,
  createOfferNotificationMessage
};