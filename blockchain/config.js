// blockchain/config.js 
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') }); // Load from server .env

const config = {
  // Quorum/Ethereum network configuration
  quorum: {
    rpcUrl: process.env.QUORUM_RPC_URL || 'http://localhost:7545',
    networkId: process.env.QUORUM_NETWORK_ID || '10',
    gasLimit: process.env.GAS_LIMIT || '4712388',
    gasPrice: process.env.GAS_PRICE || '0'
  },
  
  // Smart contract addresses (populated after deployment)
  contracts: {
    diamondNFT: process.env.DIAMOND_NFT_ADDRESS || '',
    diamondLending: process.env.DIAMOND_LENDING_ADDRESS || ''
  },
  
  // Wallet configuration
  wallet: {
    mnemonic: process.env.WALLET_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    derivationPath: "m/44'/60'/0'/0/",
    encryptionKey: process.env.WALLET_ENCRYPTION_KEY || 'your-secret-key-32-characters-long'
  },
  
  // Deployment configuration
  deployment: {
    gasLimit: '4712388',
    gasPrice: '0',
    confirmations: 1
  }
};

module.exports = config;