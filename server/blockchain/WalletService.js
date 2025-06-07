// blockchain/WalletService.js
const Web3 = require('web3').default;
const { HDWalletProvider } = require('@truffle/hdwallet-provider');
const crypto = require('crypto');
const config = require('./config');

class WalletService {
  constructor() {
    this.web3 = null;
    this.wallets = new Map(); // Store encrypted wallet data
    this.init();
  }

  async init() {
    try {
      // Initialize Web3 with Quorum
      this.web3 = new Web3(config.quorum.rpcUrl);
      console.log('Wallet service initialized with Quorum network');
    } catch (error) {
      console.error('Failed to initialize wallet service:', error);
      throw error;
    }
  }

  // Create a new wallet for a merchant
  async createMerchantWallet(merchantId) {
    try {
      // Generate a new account
      const account = this.web3.eth.accounts.create();
      
      // Create wallet data
      const walletData = {
        address: account.address,
        privateKey: account.privateKey,
        merchantId: merchantId,
        createdAt: new Date(),
        balance: '0'
      };

      // Encrypt private key before storing
      const encryptedWallet = this.encryptWalletData(walletData);
      
      // Store encrypted wallet
      this.wallets.set(merchantId, encryptedWallet);

      console.log(`Created wallet for merchant ${merchantId}: ${account.address}`);

      return {
        address: account.address,
        merchantId: merchantId,
        createdAt: walletData.createdAt
      };
    } catch (error) {
      console.error('Error creating merchant wallet:', error);
      throw error;
    }
  }

  // Get merchant wallet (decrypted)
  getMerchantWallet(merchantId) {
    try {
      const encryptedWallet = this.wallets.get(merchantId);
      if (!encryptedWallet) {
        return null;
      }

      return this.decryptWalletData(encryptedWallet);
    } catch (error) {
      console.error('Error retrieving merchant wallet:', error);
      throw error;
    }
  }

  // Get wallet balance
  async getWalletBalance(merchantId) {
    try {
      const wallet = this.getMerchantWallet(merchantId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const balance = await this.web3.eth.getBalance(wallet.address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  // Sign transaction
  async signTransaction(merchantId, transactionData) {
    try {
      const wallet = this.getMerchantWallet(merchantId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Get transaction count for nonce
      const nonce = await this.web3.eth.getTransactionCount(wallet.address);

      const tx = {
        ...transactionData,
        nonce: nonce,
        gasPrice: config.quorum.gasPrice,
        gas: transactionData.gas || config.quorum.gasLimit
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(tx, wallet.privateKey);
      return signedTx;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  // Send signed transaction
  async sendSignedTransaction(signedTransaction) {
    try {
      const receipt = await this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
      return receipt;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  // Get all merchant wallets (addresses only for privacy)
  getAllMerchantWallets() {
    const walletInfo = [];
    
    for (const [merchantId, encryptedWallet] of this.wallets) {
      const wallet = this.decryptWalletData(encryptedWallet);
      walletInfo.push({
        merchantId: merchantId,
        address: wallet.address,
        createdAt: wallet.createdAt
      });
    }

    return walletInfo;
  }

  // Encrypt wallet data
  encryptWalletData(walletData) {
    const algorithm = 'aes-256-gcm';
    const secret = process.env.WALLET_ENCRYPTION_KEY || 'your-secret-key-32-characters-long';
    const key = crypto.createHash('sha256').update(secret).digest();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(JSON.stringify(walletData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt wallet data
  decryptWalletData(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const secret = process.env.WALLET_ENCRYPTION_KEY || 'your-secret-key-32-characters-long';
    const key = crypto.createHash('sha256').update(secret).digest();
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Import existing wallet (for development/testing)
  async importWallet(merchantId, privateKey) {
    try {
      const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      
      const walletData = {
        address: account.address,
        privateKey: privateKey,
        merchantId: merchantId,
        createdAt: new Date(),
        imported: true
      };

      const encryptedWallet = this.encryptWalletData(walletData);
      this.wallets.set(merchantId, encryptedWallet);

      console.log(`Imported wallet for merchant ${merchantId}: ${account.address}`);

      return {
        address: account.address,
        merchantId: merchantId,
        createdAt: walletData.createdAt
      };
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    }
  }

  // Generate QR code data for transaction signing
  generateQRData(transactionData) {
    const qrData = {
      id: crypto.randomUUID(),
      type: transactionData.type,
      data: transactionData,
      timestamp: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    };

    return {
      qrData: qrData,
      qrString: JSON.stringify(qrData),
      hash: this.web3.utils.keccak256(JSON.stringify(qrData))
    };
  }

  // Verify QR code data
  verifyQRData(qrString, expectedHash) {
    try {
      const qrData = JSON.parse(qrString);
      const hash = this.web3.utils.keccak256(qrString);
      
      if (hash !== expectedHash) {
        return { valid: false, error: 'QR code hash mismatch' };
      }

      if (Date.now() > qrData.expiresAt) {
        return { valid: false, error: 'QR code expired' };
      }

      return { valid: true, data: qrData };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code format' };
    }
  }
}

module.exports = WalletService;