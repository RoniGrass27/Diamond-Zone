const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Diamond } = require('./models/Diamond');
const { Contract } = require('./models/Contract');
const { Counter } = require('./models/counters');
const { User } = require('./models/User');
const { Message } = require('./models/Message');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('./routes/auth-routes');
const { router: messageRoutes, createContractRequestMessage } = require('./routes/message-routes');
const blockchainRoutes = require('./blockchain-routes');
const { protect } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Message routes (protected)
app.use('/api/messages', messageRoutes);

app.get('/api/users/all', protect, async (req, res) => {
  try {
    // Only return email and name fields for privacy
    const users = await User.find({}, 'email fullName businessName').select('-password');
    
    const usersData = users.map(user => ({
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      full_name: user.fullName // Keep legacy field name for compatibility
    }));
    
    res.json(usersData);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Blockchain routes (protected)
app.use('/api/blockchain', protect, blockchainRoutes);

// Legacy endpoint for backward compatibility (now protected)
app.get('/api/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const unreadCount = await Message.getUnreadCount(user._id);

    res.json({
      id: user._id,
      email: user.email,
      full_name: user.fullName, // Keep legacy field name
      fullName: user.fullName,
      businessName: user.businessName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      walletCreated: user.walletCreated,
      walletAddress: user.walletAddress,
      unreadMessages: unreadCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get next number for auto-increment
async function getNextDiamondNumber() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'diamond' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

async function getNextContractNumber() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'contract' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// Diamond routes (protected)
app.get('/api/diamonds', protect, async (req, res) => {
  try {
    // Only show diamonds for the current user
    const diamonds = await Diamond.find({ ownerId: req.user._id });
    res.json(diamonds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/diamonds', protect, async (req, res) => {
  try {
    console.log('Creating diamond with payload size:', JSON.stringify(req.body).length, 'characters');
    
    const diamondNumber = await getNextDiamondNumber();

    const diamond = new Diamond({
      ...req.body,
      diamondNumber,
      ownerId: req.user._id // Associate with current user
    });

    await diamond.save();
    console.log('Diamond created successfully with ID:', diamond._id);
    res.status(201).json(diamond);
  } catch (error) {
    console.error("Error creating diamond:", error.message);
    console.error("Error details:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/diamonds/:id', protect, async (req, res) => {
  try {
    const updated = await Diamond.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id }, // Ensure user owns the diamond
      req.body, 
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Diamond not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/diamonds/:id', protect, async (req, res) => {
  try {
    const deleted = await Diamond.findOneAndDelete({ 
      _id: req.params.id, 
      ownerId: req.user._id 
    });
    if (!deleted) return res.status(404).json({ error: 'Diamond not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Photo upload route for diamonds
app.post('/api/diamonds/:id/photo', protect, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }

    const updated = await Diamond.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { photo: photoUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Diamond not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contract routes (protected)
app.get('/api/contracts', protect, async (req, res) => {
  try {
    // Get contracts where user is either buyer or seller
    const userEmail = req.user.email;
    const contracts = await Contract.find({
      $or: [
        { buyerEmail: userEmail },
        { sellerEmail: userEmail },
        { ownerId: req.user._id }
      ]
    }).populate('diamondId');
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// server/server.js - Complete Contract POST route replacement
// Replace the entire app.post('/api/contracts', protect, async (req, res) => { ... }) block with this:

app.post('/api/contracts', protect, async (req, res) => {
  try {
    console.log('=== Creating Contract ===');
    console.log('User:', req.user.email);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Get contract number
    const contractNumber = await getNextContractNumber();

    // Validate diamond ID first
    let diamondId = req.body.diamondId || req.body.diamond_id;
    if (!diamondId) {
      console.log('Missing diamond ID');
      return res.status(400).json({ error: 'Diamond ID is required' });
    }

    // Verify diamond exists and user owns it
    const diamond = await Diamond.findOne({ 
      _id: diamondId, 
      ownerId: req.user._id 
    });
    
    if (!diamond) {
      console.log('Diamond not found or not owned by user');
      return res.status(400).json({ error: 'Diamond not found or you do not own this diamond' });
    }

    console.log('Diamond found:', diamond.diamondNumber);

    // Validate and set emails based on contract type
    let buyerEmail, sellerEmail;
    
    if (req.body.type === 'MemoFrom') {
      buyerEmail = req.body.buyerEmail || req.body.buyer_email;
      sellerEmail = req.body.sellerEmail || req.body.seller_email;
    } else if (req.body.type === 'Buy') {
      buyerEmail = req.user.email;
      sellerEmail = req.body.buyer_email;
    } else if (req.body.type === 'Sell') {
      sellerEmail = req.user.email;
      buyerEmail = req.body.buyer_email;
    } else {
      return res.status(400).json({ error: 'Invalid contract type' });
    }

    // Validate emails
    if (!buyerEmail || !sellerEmail) {
      console.log('Missing emails:', { buyerEmail, sellerEmail });
      return res.status(400).json({ 
        error: 'Both buyer and seller emails are required',
        debug: { buyerEmail, sellerEmail, originalBuyerEmail: req.body.buyer_email }
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail) || !emailRegex.test(sellerEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('Emails validated:', { buyerEmail, sellerEmail });

    // Build contract data with proper date handling
    const now = new Date(); // This creates a proper Date object with current date and time
    
    // Handle expiration date properly
    let expirationDate;
    if (req.body.expiration_date || req.body.expirationDate) {
      // Parse the incoming date and set time to end of day
      const inputDate = req.body.expiration_date || req.body.expirationDate;
      expirationDate = new Date(inputDate);
      // Set to 23:59:59 of the expiration date to give full day
      expirationDate.setHours(23, 59, 59, 999);
    } else {
      // Default to 30 days from now
      expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expirationDate.setHours(23, 59, 59, 999);
    }

    // Build contract data with embedded diamond information
    const contractData = {
      type: req.body.type,
      diamondId: diamondId,
      // Store diamond information directly in the contract
      diamondInfo: {
        diamondNumber: diamond.diamondNumber,
        carat: diamond.carat,
        shape: diamond.shape,
        color: diamond.color,
        clarity: diamond.clarity,
        cut: diamond.cut,
        polish: diamond.polish,
        symmetry: diamond.symmetry,
        uv: diamond.uv,
        price: diamond.price,
        status: diamond.status
      },
      ownerId: req.user._id,
      buyerEmail: buyerEmail,
      sellerEmail: sellerEmail,
      contractNumber: contractNumber,
      status: 'pending',
      createdDate: now, // Use proper Date object with current time
      expirationDate: expirationDate,
      blockchain_enabled: req.body.blockchain_enabled || false,
      wallet_address: req.body.wallet_address || null
    };

    // Add type-specific fields
    if (req.body.type === 'MemoFrom') {
      contractData.duration = req.body.duration || 30;
      contractData.terms = req.body.terms || '';
    }

    if (req.body.type === 'Buy' || req.body.type === 'Sell') {
      if (!req.body.price || req.body.price <= 0) {
        return res.status(400).json({ error: 'Valid price is required for Buy/Sell contracts' });
      }
      contractData.price = req.body.price;
    }

    console.log('Final contract data with proper dates:', {
      ...contractData,
      createdDate: contractData.createdDate.toISOString(),
      expirationDate: contractData.expirationDate.toISOString()
    });

    // Create and save contract
    const contract = new Contract(contractData);
    await contract.save();
    
    console.log('Contract saved with ID:', contract._id);
    console.log('Contract number:', contract.contractNumber);
    console.log('Contract created at:', contract.createdDate.toISOString());

    // Create notification message
    try {
      let recipientEmail = null;
      
      if (contract.type === 'MemoFrom') {
        recipientEmail = contract.buyerEmail;
      } else if (contract.type === 'Buy') {
        recipientEmail = contract.sellerEmail;
      } else if (contract.type === 'Sell') {
        recipientEmail = contract.buyerEmail;
      }
      
      if (recipientEmail && recipientEmail !== req.user.email) {
        console.log('Creating notification for:', recipientEmail);
        
        await createContractRequestMessage(
          req.user._id,
          recipientEmail,
          contract._id,
          {
            type: contract.type,
            diamondNumber: diamond.diamondNumber,
            diamondId: diamond._id,
            price: contract.price,
            expirationDate: contract.expirationDate,
            duration: contract.duration,
            terms: contract.terms
          }
        );
        
        console.log('Notification message created');
      } else {
        console.log('No notification needed (same user or missing email)');
      }
    } catch (messageError) {
      console.error('Message creation failed (but contract was created):', messageError);
    }

    res.status(201).json({
      success: true,
      contract: contract
    });
    
  } catch (error) {
    console.error("Error creating contract:", error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        error: 'Contract validation failed', 
        details: messages
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate contract number' });
    }
    
    res.status(500).json({ 
      error: 'Server error creating contract',
      message: error.message
    });
  }
});

app.post('/api/contracts/:id/approve', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Ensure the current user is one of the involved parties
    const userEmail = req.user.email;
    const isRecipient = contract.buyerEmail === userEmail || contract.sellerEmail === userEmail;
    if (!isRecipient) {
      return res.status(403).json({ error: 'Not authorized to approve this contract' });
    }

    // Update contract status
    contract.status = 'approved';
    contract.approvedAt = new Date();
    await contract.save();

    // Notify the contract creator
    try {
      const creator = await User.findById(contract.ownerId);
      if (creator && creator.email !== userEmail) {
        const message = new Message({
          type: 'contract_approval',
          fromUser: req.user._id,
          toUser: creator._id,
          title: 'Contract Approved',
          content: `Your ${contract.type} contract #${contract.contractNumber} has been approved.`,
          contractId: contract._id,
          metadata: { priority: 'high' }
        });
        await message.save();
      }
    } catch (msgErr) {
      console.error("Message creation failed (but contract was approved):", msgErr);
    }

    res.json({ success: true, contract });
  } catch (error) {
    console.error("Error approving contract:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contracts/:id/reject', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is the intended recipient
    const userEmail = req.user.email;
    const isRecipient = (contract.buyerEmail === userEmail) || (contract.sellerEmail === userEmail);
    
    if (!isRecipient) {
      return res.status(403).json({ error: 'Not authorized to reject this contract' });
    }

    // Update contract status
    contract.status = 'rejected';
    contract.rejectedAt = new Date();
    await contract.save();

    // Create notification message to contract creator
    try {
      const creator = await User.findById(contract.ownerId);
      if (creator && creator.email !== userEmail) {
        const message = new Message({
          type: 'contract_approval',
          fromUser: req.user._id,
          toUser: creator._id,
          title: 'Contract Rejected',
          content: `Your ${contract.type} contract #${contract.contractNumber} has been rejected`,
          contractId: contract._id,
          metadata: { priority: 'medium' }
        });
        await message.save();
      }
    } catch (messageError) {
      console.error('Error creating rejection notification:', messageError);
    }

    res.json({ success: true, contract });
  } catch (error) {
    console.error('Error rejecting contract:', error);
    res.status(500).json({ error: error.message });
  }
});

// Legacy login/logout routes for backward compatibility
app.post('/api/login', async (req, res) => {
  // Redirect to new auth endpoint
  const response = await fetch(`${req.protocol}://${req.get('host')}/api/auth/login`, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body)
  });
  const data = await response.json();
  res.status(response.status).json(data);
});

app.post('/api/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// User blockchain wallet management
app.post('/api/users/enable-blockchain', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.walletCreated) {
      return res.json({ 
        success: true, 
        message: 'Wallet already exists',
        wallet: {
          address: user.walletAddress,
          createdAt: user.updatedAt
        }
      });
    }
    
    const WalletService = require('./blockchain/WalletService');
    const walletService = new WalletService();
    
    const wallet = await walletService.createMerchantWallet(user._id.toString());
    
    // Update user record
    user.walletCreated = true;
    user.walletAddress = wallet.address;
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: 'Blockchain enabled successfully',
      wallet: {
        address: wallet.address,
        createdAt: wallet.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error enabling blockchain:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      blockchain: 'available',
      authentication: 'enabled'
    }
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Debugging
app.get('/api/debug/messages', protect, async (req, res) => {
  try {
    console.log('Debug endpoint called by:', req.user.email);
    
    // Get all users
    const users = await User.find({}).select('email fullName businessName');
    
    // Get all messages for current user
    const userMessages = await Message.find({ toUser: req.user._id })
      .populate('fromUser', 'fullName email businessName')
      .populate('contractId', 'contractNumber type status')
      .sort({ createdAt: -1 });
    
    // Get all contracts related to current user
    const userContracts = await Contract.find({
      $or: [
        { ownerId: req.user._id },
        { buyerEmail: req.user.email },
        { sellerEmail: req.user.email }
      ]
    }).populate('ownerId', 'email fullName');
    
    // Get message stats
    const messageStats = {
      total: await Message.countDocuments({ toUser: req.user._id }),
      unread: await Message.countDocuments({ toUser: req.user._id, isRead: false }),
      byType: await Message.aggregate([
        { $match: { toUser: req.user._id } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    };

    res.json({
      success: true,
      debug: {
        currentUser: {
          id: req.user._id,
          email: req.user.email,
          fullName: req.user.fullName
        },
        allUsers: users.map(u => ({ email: u.email, name: u.fullName })),
        messages: userMessages,
        contracts: userContracts,
        messageStats: messageStats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test message creation endpoint
app.post('/api/debug/create-test-message', protect, async (req, res) => {
  try {
    const { toUserEmail } = req.body;
    
    if (!toUserEmail) {
      return res.status(400).json({ error: 'toUserEmail is required' });
    }
    
    const toUser = await User.findOne({ email: toUserEmail.toLowerCase() });
    if (!toUser) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }
    
    const testMessage = new Message({
      type: 'system_notification',
      fromUser: req.user._id,
      toUser: toUser._id,
      title: 'Test Message',
      content: `This is a test message from ${req.user.fullName || req.user.email}`,
      metadata: { priority: 'medium' }
    });
    
    await testMessage.save();
    
    res.json({
      success: true,
      message: 'Test message created',
      messageId: testMessage._id
    });
    
  } catch (error) {
    console.error('Test message creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/debug-contract-data', protect, async (req, res) => {
  console.log('=== DEBUG CONTRACT DATA ===');
  console.log('User:', req.user.email);
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body));
  console.log('Full body:', JSON.stringify(req.body, null, 2));
  
  res.json({
    success: true,
    debug: {
      userEmail: req.user.email,
      bodyKeys: Object.keys(req.body),
      body: req.body,
      hasBuyerEmail: !!req.body.buyer_email,
      buyerEmailValue: req.body.buyer_email,
      hasSellerEmail: !!req.body.seller_email,
      sellerEmailValue: req.body.seller_email
    }
  });
});
// End of debugging

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  - Authentication: /api/auth/*');
  console.log('  - Messages: /api/messages/*');
  console.log('  - Diamonds: /api/diamonds/*');
  console.log('  - Contracts: /api/contracts/*');
  console.log('  - Blockchain: /api/blockchain/*');
  console.log('  - Health check: /api/health');
});