// blockchain/test-connection.js
const Web3 = require('web3').default;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function testConnection() {
  try {
    console.log('Testing connection to Ganache...');
    console.log('RPC URL:', process.env.QUORUM_RPC_URL);
    
    // Create Web3 instance
    const web3 = new Web3(process.env.QUORUM_RPC_URL || 'http://localhost:7545');
    
    // Test connection
    const isConnected = await web3.eth.net.isListening();
    console.log('Connected:', isConnected);
    
    // Get network info
    const networkId = await web3.eth.net.getId();
    console.log('Network ID:', networkId);
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    console.log('Available accounts:', accounts.length);
    console.log('First account:', accounts[0]);
    
    // Get balance of first account
    if (accounts[0]) {
      const balance = await web3.eth.getBalance(accounts[0]);
      console.log('Balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
    }
    
    console.log('\n✅ Connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

// Run the test
testConnection();