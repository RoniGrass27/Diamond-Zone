// server/blockchain/config.js - Server-side blockchain configuration
const config = {
  // Quorum network configuration for server
  quorum: {
    rpcUrl: process.env.QUORUM_RPC_URL || 'http://localhost:8545',
    networkId: process.env.QUORUM_NETWORK_ID || '10',
    gasLimit: process.env.GAS_LIMIT || '4712388',
    gasPrice: process.env.GAS_PRICE || '0'
  },
  
  // Smart contract addresses (will be set after deployment)
  contracts: {
    diamondNFT: process.env.DIAMOND_NFT_ADDRESS || '',
    diamondLending: process.env.DIAMOND_LENDING_ADDRESS || ''
  },
  
  // Wallet configuration for server operations
  wallet: {
    mnemonic: process.env.WALLET_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    derivationPath: "m/44'/60'/0'/0/",
    encryptionKey: process.env.WALLET_ENCRYPTION_KEY || 'your-secret-key-32-characters-long-replace-this-with-secure-key'
  },
  
  // MongoDB configuration (using existing)
  mongodb: {
    uri: process.env.MONGODB_URI
  },
  
  // API configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    blockchainPath: '/api/blockchain'
  },
  
  // Security settings
  security: {
    walletEncryption: true,
    requireSignature: true,
    maxRetries: 3,
    timeout: 30000 // 30 seconds
  },
  
  // Development settings
  development: {
    autoCreateWallets: true,
    skipBlockchainValidation: false,
    logTransactions: true
  }
};

module.exports = config;