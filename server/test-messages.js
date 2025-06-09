const mongoose = require('mongoose');
const { User } = require('./models/User');
const { Message } = require('./models/Message');
const { Contract } = require('./models/Contract');
require('dotenv').config();

async function testMessageSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Check if users exist
    console.log('\n=== Testing Users ===');
    const users = await User.find({}).select('email fullName');
    console.log('Users in database:', users);

    if (users.length < 2) {
      console.log('Need at least 2 users to test messaging');
      return;
    }

    // Test 2: Create a test message
    console.log('\n=== Creating Test Message ===');
    const fromUser = users[0];
    const toUser = users[1];

    const testMessage = new Message({
      type: 'contract_request',
      fromUser: fromUser._id,
      toUser: toUser._id,
      title: 'Test Contract Request',
      content: `${fromUser.fullName} has sent you a test contract request`,
      isActionRequired: true,
      actionType: 'approve_contract',
      metadata: {
        price: 1000,
        priority: 'high'
      }
    });

    await testMessage.save();
    console.log('Test message created:', testMessage._id);

    // Test 3: Check messages for each user
    console.log('\n=== Checking Messages for Each User ===');
    
    for (const user of users) {
      const userMessages = await Message.find({ toUser: user._id })
        .populate('fromUser', 'fullName email')
        .sort({ createdAt: -1 });
      
      console.log(`\nMessages for ${user.email}:`);
      userMessages.forEach(msg => {
        console.log(`  - ${msg.title} (from: ${msg.fromUser?.email || 'Unknown'}) [${msg.isRead ? 'Read' : 'Unread'}]`);
      });
    }

    // Test 4: Check contracts
    console.log('\n=== Checking Contracts ===');
    const contracts = await Contract.find({})
      .populate('ownerId', 'email')
      .sort({ createdDate: -1 })
      .limit(5);
    
    contracts.forEach(contract => {
      console.log(`Contract #${contract.contractNumber}: ${contract.type} (Owner: ${contract.ownerId?.email || 'Unknown'})`);
      console.log(`  Buyer: ${contract.buyerEmail || 'N/A'}, Seller: ${contract.sellerEmail || 'N/A'}`);
      console.log(`  Status: ${contract.status}`);
    });

    console.log('\nMessage system test completed');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testMessageSystem();