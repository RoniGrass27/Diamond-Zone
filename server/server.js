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

// Test route to see if routes are being registered
app.get('/api/test-marketplace', (req, res) => {
  console.log('=== TEST ROUTE HIT ===');
  res.json({ message: 'Test marketplace route works!' });
});

// Marketplace route - get all diamonds for marketplace display
app.get('/api/diamonds/all', protect, async (req, res) => {
  try {
    console.log('Marketplace request received from user:', req.user.email);
    
    // Get only "In Stock" diamonds from all users for marketplace display
    const diamonds = await Diamond.find({ status: 'In Stock' })
      .populate('ownerId', 'fullName businessName email')
      .sort({ createdAt: -1 });
    
    console.log(`Marketplace: Found ${diamonds.length} diamonds in stock`);
    
    // Log first few diamonds for debugging
    if (diamonds.length > 0) {
      console.log('Sample diamond:', {
        id: diamonds[0]._id,
        diamondNumber: diamonds[0].diamondNumber,
        status: diamonds[0].status,
        ownerId: diamonds[0].ownerId
      });
    }
    
    res.json(diamonds);
  } catch (error) {
    console.error('Marketplace error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/diamonds', protect, async (req, res) => {
  try {
    console.log('Creating diamond with payload size:', JSON.stringify(req.body).length, 'characters');
    
    const diamondNumber = await getNextDiamondNumber();

    // Always set status to "In Stock" for new diamonds
    const diamondData = {
      ...req.body,
      status: 'In Stock', // Force status to "In Stock" for new diamonds
      diamondNumber,
      ownerId: req.user._id // Associate with current user
    };

    const diamond = new Diamond(diamondData);

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

    // Verify diamond exists
    const diamond = await Diamond.findById(diamondId);
    
    if (!diamond) {
      console.log('Diamond not found');
      return res.status(400).json({ error: 'Diamond not found' });
    }

    // For MemoTo contracts (marketplace bidding), buyer doesn't need to own the diamond
    // For other contract types, user must own the diamond
    if (req.body.type !== 'MemoTo') {
      if (diamond.ownerId.toString() !== req.user._id.toString()) {
        console.log('Diamond not owned by user');
        return res.status(400).json({ error: 'You do not own this diamond' });
      }
    }

    console.log('Diamond found:', diamond.diamondNumber);

    // Validate and set emails based on contract type
    let buyerEmail, sellerEmail;
    
    if (req.body.type === 'MemoFrom') {
      buyerEmail = req.body.buyerEmail || req.body.buyer_email;
      sellerEmail = req.body.sellerEmail || req.body.seller_email;
    } else if (req.body.type === 'MemoTo') {
      // For MemoTo contracts (marketplace bidding), buyer is current user, seller is diamond owner
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
      ownerId: req.body.type === 'MemoTo' ? diamond.ownerId : req.user._id,
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
    if (req.body.type === 'MemoFrom' || req.body.type === 'MemoTo') {
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
        // For MemoFrom: buyer receives notification (buyer needs to approve)
        recipientEmail = contract.buyerEmail;
      } else if (contract.type === 'MemoTo') {
        // For MemoTo: seller receives notification (seller needs to approve)
        recipientEmail = contract.sellerEmail;
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

    // Ensure the current user is one of the involved parties and can approve
    const userEmail = req.user.email;
    const canApprove = contract.canApprove(userEmail);
    if (!canApprove) {
      return res.status(403).json({ error: 'Not authorized to approve this contract' });
    }

    // Clear any existing price offers when contract is approved
    if (contract.priceOffer) {
      contract.priceOffer = null;
    }

    // Update contract status
    contract.status = 'approved';
    contract.approvedAt = new Date();
    await contract.save();

    // Update diamond status for MemoFrom and MemoTo contracts
    if (contract.type === 'MemoFrom' || contract.type === 'MemoTo') {
      try {
        // Update the original diamond to have "Memo From" status and link it to the contract
        await Diamond.findByIdAndUpdate(contract.diamondId, {
          status: 'Memo From',
          contractId: contract._id,
          memoType: 'Memo From'
        });
        console.log('Diamond status updated to "Memo From" and linked to contract after contract approval');
        
        // DO NOT create a copy - just update the contract status
        // The buyer will see the diamond through the contract relationship
        // This prevents diamond duplication issues
      } catch (diamondUpdateError) {
        console.error('Failed to update diamond status:', diamondUpdateError);
        // Continue even if diamond update fails
      }
    }

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

app.use('/api/inventory', require('./routes/inventory-routes'));

// Return request endpoint
app.post('/api/contracts/:id/request-return', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if contract is approved and can have return requested
    if (contract.status !== 'approved') {
      return res.status(400).json({ error: 'Contract must be approved to request return' });
    }

    // Check if return is already requested
    if (contract.returnRequested) {
      return res.status(400).json({ error: 'Return already requested for this contract' });
    }

    // Ensure the current user is one of the involved parties
    const userEmail = req.user.email;
    const isInvolved = (contract.buyerEmail === userEmail) || (contract.sellerEmail === userEmail);
    if (!isInvolved) {
      return res.status(403).json({ error: 'Not authorized to request return for this contract' });
    }

    // Update contract with return request
    contract.returnRequested = true;
    contract.returnRequestedBy = userEmail;
    contract.returnRequestedAt = new Date();
    contract.returnStatus = 'pending_approval';
    await contract.save();

    // Determine who needs to approve the return
    const approverEmail = userEmail === contract.buyerEmail ? contract.sellerEmail : contract.buyerEmail;
    
    // Create notification message to the approver
    try {
      const approver = await User.findOne({ email: approverEmail });
      if (approver) {
        const message = new Message({
          type: 'return_request',
          fromUser: req.user._id,
          toUser: approver._id,
          title: 'Return Request',
          content: `A return has been requested for contract #${contract.contractNumber}. Please review and approve.`,
          contractId: contract._id,
          metadata: { 
            priority: 'high',
            contractType: contract.type,
            returnRequester: userEmail
          }
        });
        await message.save();
        console.log('Return request message created successfully');
      }
    } catch (msgErr) {
      console.error("Message creation failed (but return request was saved):", msgErr);
    }

    res.json({ 
      success: true, 
      contract,
      message: 'Return request submitted successfully'
    });
  } catch (error) {
    console.error("Error requesting return:", error);
    res.status(500).json({ error: error.message });
  }
});

// Approve return endpoint
app.post('/api/contracts/:id/approve-return', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if return is requested and pending approval
    if (!contract.returnRequested || contract.returnStatus !== 'pending_approval') {
      return res.status(400).json({ error: 'No return request pending for this contract' });
    }

    // Ensure the current user is the approver (not the requester)
    const userEmail = req.user.email;
    if (contract.returnRequestedBy === userEmail) {
      return res.status(403).json({ error: 'You cannot approve your own return request' });
    }

    // Ensure the current user is one of the involved parties
    const isInvolved = (contract.buyerEmail === userEmail) || (contract.sellerEmail === userEmail);
    if (!isInvolved) {
      return res.status(403).json({ error: 'Not authorized to approve return for this contract' });
    }

    // Process the return
    try {
      console.log('Processing return for contract:', contract._id);
      
      // Find diamonds associated with this contract with multiple fallback strategies
      let sellerDiamond = null;
      let buyerDiamond = null;

      // Strategy 1: Find by contractId (for new contracts)
      sellerDiamond = await Diamond.findOne({ 
        contractId: contract._id,
        status: 'Memo From'
      });
      
      buyerDiamond = await Diamond.findOne({ 
        contractId: contract._id, 
        status: 'Memo To' 
      });

      // Strategy 2: If not found by contractId, find by original diamondId (for existing contracts)
      if (!sellerDiamond && contract.diamondId) {
        sellerDiamond = await Diamond.findOne({ 
          _id: contract.diamondId,
          status: 'Memo From'
        });
        
        // Also try to find any diamond with this ID that might not have the status updated
        if (!sellerDiamond) {
          sellerDiamond = await Diamond.findById(contract.diamondId);
        }
      }

      console.log('Found seller diamond by contractId:', sellerDiamond ? sellerDiamond._id : 'Not found');
      console.log('Found buyer diamond by contractId:', buyerDiamond ? buyerDiamond._id : 'Not found');

      // Update seller's diamond back to "In Stock"
      if (sellerDiamond) {
        const updateResult = await Diamond.findByIdAndUpdate(sellerDiamond._id, { 
          status: 'In Stock',
          contractId: null,
          memoType: null
        }, { new: true });
        
        console.log('Seller diamond updated successfully:', updateResult ? updateResult._id : 'Failed');
        
        if (!updateResult) {
          throw new Error('Failed to update seller diamond status');
        }
      } else {
        console.log('Warning: No seller diamond found - this may be an existing contract without proper diamond linking');
      }

      if (buyerDiamond) {
        // Delete the buyer's diamond copy
        const deleteResult = await Diamond.findByIdAndDelete(buyerDiamond._id);
        console.log('Buyer diamond deleted successfully:', deleteResult ? deleteResult._id : 'Failed');
        
        if (!deleteResult) {
          throw new Error('Failed to delete buyer diamond');
        }
      } else {
        console.log('Warning: No buyer diamond found - this may be an existing contract without proper diamond linking');
      }

      // Update contract status
      contract.status = 'completed';
      contract.returnStatus = 'approved';
      contract.returnApprovedAt = new Date();
      contract.returnApprovedBy = userEmail;
      await contract.save();
      
      console.log('Contract status updated to completed');

      // Create notification message to the return requester
      try {
        const requester = await User.findOne({ email: contract.returnRequestedBy });
        if (requester) {
          const message = new Message({
            type: 'return_approved',
            fromUser: req.user._id,
            toUser: requester._id,
            title: 'Return Approved',
            content: `Your return request for contract #${contract.contractNumber} has been approved. The diamond has been returned.`,
            contractId: contract._id,
            metadata: { 
              priority: 'high',
              contractType: contract.type
            }
          });
          await message.save();
          console.log('Return approved message created successfully');
        }
      } catch (msgErr) {
        console.error("Message creation failed (but return was processed):", msgErr);
        // Continue processing even if message creation fails
      }

      res.json({ 
        success: true, 
        contract,
        message: 'Return approved successfully',
        inventoryUpdated: sellerDiamond ? true : false
      });
    } catch (diamondError) {
      console.error('Error processing diamond return:', diamondError);
      res.status(500).json({ error: 'Failed to process diamond return' });
    }
  } catch (error) {
    console.error("Error approving return:", error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh inventory endpoint - returns updated diamond data for the current user
app.get('/api/diamonds/refresh', protect, async (req, res) => {
  try {
    // Get fresh diamond data for the current user
    const diamonds = await Diamond.find({ ownerId: req.user._id }).sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      diamonds,
      timestamp: new Date().toISOString(),
      message: 'Inventory refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// Price offer endpoint
app.post('/api/contracts/price-offer', protect, async (req, res) => {
  try {
    const { contractId, price, action, proposedBy } = req.body;
    
    if (!contractId || !price || !action || !proposedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is involved in the contract
    const userEmail = req.user.email;
    if (contract.buyerEmail !== userEmail && contract.sellerEmail !== userEmail) {
      return res.status(403).json({ error: 'Not authorized to make price offer for this contract' });
    }

    // Check if contract is approved and can accept price offers
    if (contract.status !== 'approved') {
      return res.status(400).json({ error: 'Contract must be approved to make price offers' });
    }

    // Check if there's already a pending price offer
    if (contract.priceOffer && contract.priceOffer.status === 'pending') {
      return res.status(400).json({ error: 'A price offer is already pending for this contract' });
    }

    // Update contract with price offer
    contract.priceOffer = {
      price: price,
      action: action,
      proposedBy: proposedBy,
      proposedAt: new Date(),
      status: 'pending'
    };

    await contract.save();

    // Create notification message to the other party
    try {
      const recipientEmail = proposedBy === contract.buyerEmail ? contract.sellerEmail : contract.buyerEmail;
      const recipient = await User.findOne({ email: recipientEmail });
      
      if (recipient) {
        const message = new Message({
          type: 'offer_notification',
          fromUser: req.user._id,
          toUser: recipient._id,
          title: 'Price Offer Received',
          content: `A ${action} offer of $${price} has been made for contract #${contract.contractNumber}. Please review and respond.`,
          contractId: contract._id,
          metadata: { 
            priority: 'high',
            offerType: action,
            offerPrice: price
          }
        });
        await message.save();
      }
    } catch (msgErr) {
      console.error("Message creation failed (but price offer was saved):", msgErr);
    }

    // Return the updated contract so the frontend can refresh
    res.json({ 
      success: true, 
      contract: contract,
      message: 'Price offer submitted successfully'
    });
  } catch (error) {
    console.error("Error submitting price offer:", error);
    res.status(500).json({ error: error.message });
  }
});

// Approve sale endpoint
app.post('/api/contracts/:id/approve-sale', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if there's a pending price offer
    if (!contract.priceOffer || contract.priceOffer.status !== 'pending') {
      return res.status(400).json({ error: 'No pending price offer found' });
    }

    // Check if user is the other party (not the one who proposed the offer)
    const userEmail = req.user.email;
    if (contract.priceOffer.proposedBy === userEmail) {
      return res.status(400).json({ error: 'You cannot approve your own offer' });
    }

    // Update contract status and mark sale as completed
    const updatedContract = await Contract.findByIdAndUpdate(
      contract._id,
      {
        status: 'completed',
        saleCompleted: true,
        saleCompletedAt: new Date(),
        salePrice: contract.priceOffer.price,
        'priceOffer.status': 'approved',
        'diamondInfo.price': contract.priceOffer.price,
        'diamondInfo.status': contract.priceOffer.action === 'buy' ? 'Sold' : 'In Stock',
        type: contract.priceOffer.action === 'buy' ? 'Buy' : 'Sell'
      },
      { new: true }
    );

    // Find and update the actual diamond documents
    let sellerDiamond = null;
    let buyerDiamond = null;
    let buyerUser = null;

    try {
      // First, find the buyer user to get their ID
      buyerUser = await User.findOne({ email: contract.buyerEmail });
      if (!buyerUser) {
        throw new Error('Buyer user not found');
      }

      // Strategy 1: Find by contractId
      sellerDiamond = await Diamond.findOne({ 
        contractId: contract._id,
        status: 'Memo From'
      });
      
      buyerDiamond = await Diamond.findOne({ 
        contractId: contract._id, 
        status: 'Memo To' 
      });

      // Strategy 2: If not found by contractId, find by original diamond ID and owner
      if (!sellerDiamond) {
        sellerDiamond = await Diamond.findOne({ 
          _id: contract.diamondId,
          status: { $in: ['Memo From', 'In Stock'] }
        });
      }

      if (!buyerDiamond) {
        // Find buyer's diamond by diamond number and buyer user ID
        buyerDiamond = await Diamond.findOne({ 
          diamondNumber: contract.diamondInfo?.diamondNumber,
          ownerId: buyerUser._id,
          status: { $in: ['Memo To', 'In Stock', 'Sold'] }
        });
        
        if (!buyerDiamond) {
          // Fallback: Find buyer's diamond by just diamond number and buyer user ID
          buyerDiamond = await Diamond.findOne({ 
            diamondNumber: contract.diamondInfo?.diamondNumber,
            ownerId: buyerUser._id
          });
        }
      }

      console.log('Found diamonds - Seller:', sellerDiamond?._id, 'Buyer:', buyerDiamond?._id);

      // CRITICAL FIX: Transfer ownership of the diamond from seller to buyer
      if (sellerDiamond) {
        // Update seller's diamond to "Sold" status and transfer ownership to buyer
        const updateResult = await Diamond.findByIdAndUpdate(sellerDiamond._id, { 
          status: 'In Stock', // CHANGE STATUS TO "In Stock" for the new owner (buyer)
          ownerId: buyerUser._id, // TRANSFER OWNERSHIP to buyer
          salePrice: contract.priceOffer.price,
          soldAt: new Date(),
          price: contract.priceOffer.price,
          contractId: null, // Remove contract link
          memoType: null, // Remove memo type
          previousOwnerId: sellerDiamond.ownerId // Store previous owner for inventory display
        }, { new: true });
        
        console.log('Seller diamond updated to In Stock and ownership transferred to buyer:', updateResult ? 'success' : 'failed');
        
        // The diamond is now owned by the buyer with "In Stock" status
        // It will show as "In Stock" in buyer's inventory and "Sold" in seller's inventory
      }

      // Update buyer's diamond to "In Stock" status (if it exists as a separate copy)
      if (buyerDiamond && buyerDiamond._id.toString() !== sellerDiamond._id.toString()) {
        const updateResult = await Diamond.findByIdAndUpdate(buyerDiamond._id, { 
          status: 'In Stock',
          contractId: null,
          memoType: null,
          price: contract.priceOffer.price
        }, { new: true });
        
        console.log('Buyer diamond copy updated to In Stock:', updateResult ? updateResult._id : 'Failed');
      }

      // If no separate buyer diamond exists, the transferred seller diamond will serve as the buyer's diamond
      if (!buyerDiamond) {
        console.log('No separate buyer diamond found - using transferred seller diamond as buyer diamond');
      }

    } catch (diamondError) {
      console.error('Error updating diamonds:', diamondError);
      throw diamondError; // Re-throw to prevent contract completion if diamond update fails
    }

    // Send notification message to the offer proposer
    try {
      // First find the user IDs for the message
      const recipientUser = await User.findOne({ email: contract.priceOffer.proposedBy });
      const senderUser = await User.findOne({ email: userEmail });
      
      if (recipientUser && senderUser) {
        const message = new Message({
          title: `Sale Offer Approved`,
          toUser: recipientUser._id,
          fromUser: senderUser._id,
          recipient: contract.priceOffer.proposedBy,
          sender: userEmail,
          type: 'system_notification',
          content: `Your ${contract.priceOffer.action} offer for $${contract.priceOffer.price} has been approved! The diamond has been sold.`,
          contractId: contract._id
        });
        await message.save();
        console.log('Sale approval message sent to:', contract.priceOffer.proposedBy);
      } else {
        console.log('Could not find users for message creation');
      }
    } catch (messageError) {
      console.error('Error sending sale approval message:', messageError);
    }

    res.json({ 
      success: true, 
      contract: updatedContract,
      message: 'Sale approved successfully' 
    });

  } catch (error) {
    console.error('Error approving sale:', error);
    res.status(500).json({ error: 'Failed to approve sale' });
  }
});

// Reject sale endpoint
app.post('/api/contracts/:id/reject-sale', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if there's a pending price offer
    if (!contract.priceOffer || contract.priceOffer.status !== 'pending') {
      return res.status(400).json({ error: 'No pending price offer found' });
    }

    // Ensure the current user is the rejector (not the proposer)
    const userEmail = req.user.email;
    if (contract.priceOffer.proposedBy === userEmail) {
      return res.status(403).json({ error: 'You cannot reject your own price offer' });
    }

    // Ensure the current user is one of the involved parties
    if (contract.buyerEmail !== userEmail && contract.sellerEmail !== userEmail) {
      return res.status(403).json({ error: 'Not authorized to reject this sale' });
    }

    // Update contract to reject the price offer
    contract.priceOffer.status = 'rejected';
    contract.priceOffer.rejectedAt = new Date();
    contract.priceOffer.rejectedBy = userEmail;
    await contract.save();

    // Create notification message to the price offer proposer
    try {
      const proposer = await User.findOne({ email: contract.priceOffer.proposedBy });
      if (proposer) {
        const message = new Message({
          type: 'offer_notification',
          fromUser: req.user._id,
          toUser: proposer._id,
          title: 'Sale Offer Rejected',
          content: `Your ${contract.priceOffer.action} offer of $${contract.priceOffer.price} for contract #${contract.contractNumber} has been rejected.`,
          contractId: contract._id,
          metadata: { 
            priority: 'medium',
            offerType: contract.priceOffer.action,
            offerPrice: contract.priceOffer.price
          }
        });
        await message.save();
      }
    } catch (msgErr) {
      console.error("Message creation failed (but sale rejection was saved):", msgErr);
    }

    res.json({ 
      success: true, 
      contract,
      message: 'Sale offer rejected successfully'
    });
  } catch (error) {
    console.error("Error rejecting sale:", error);
    res.status(500).json({ error: error.message });
  }
});