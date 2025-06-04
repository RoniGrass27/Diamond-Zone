// blockchain/ContractService.js
const Web3 = require('web3');
const config = require('./config');

// Import contract ABIs (these will be generated after compiling contracts)
const DiamondLendingABI = require('./abis/DiamondLending.json');
const DiamondNFTABI = require('./abis/DiamondNFT.json');

class ContractService {
  constructor(walletService) {
    this.walletService = walletService;
    this.web3 = new Web3(config.quorum.rpcUrl);
    this.diamondLendingContract = null;
    this.diamondNFTContract = null;
    this.init();
  }

  async init() {
    try {
      // Initialize contract instances
      if (config.contracts.diamondLending) {
        this.diamondLendingContract = new this.web3.eth.Contract(
          DiamondLendingABI,
          config.contracts.diamondLending
        );
      }

      if (config.contracts.diamondNFT) {
        this.diamondNFTContract = new this.web3.eth.Contract(
          DiamondNFTABI,
          config.contracts.diamondNFT
        );
      }

      console.log('Contract service initialized');
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
    }
  }

  // Add diamond to blockchain
  async addDiamondToBlockchain(merchantId, diamondData) {
    try {
      const wallet = this.walletService.getMerchantWallet(merchantId);
      if (!wallet) {
        throw new Error('Merchant wallet not found');
      }

      const {
        certificateNumber,
        weight,
        shape,
        color,
        clarity,
        cut,
        polish,
        symmetry,
        uv,
        cost,
        supplier,
        buyingDate,
        expenses
      } = diamondData;

      // Prepare transaction data
      const tx = this.diamondLendingContract.methods.addDiamond(
        certificateNumber || `CERT-${Date.now()}`,
        Math.floor((weight || 1) * 100), // Convert to smallest unit
        shape || '',
        color || '',
        clarity || '',
        cut || '',
        polish || '',
        symmetry || '',
        uv || '',
        this.web3.utils.toWei((cost || 0).toString(), 'ether'),
        supplier || '',
        Math.floor(new Date(buyingDate || Date.now()).getTime() / 1000),
        this.web3.utils.toWei((expenses || 0).toString(), 'ether')
      );

      // Estimate gas
      const gasEstimate = await tx.estimateGas({ from: wallet.address });

      // Prepare transaction
      const transactionData = {
        from: wallet.address,
        to: config.contracts.diamondLending,
        data: tx.encodeABI(),
        gas: gasEstimate,
        gasPrice: config.quorum.gasPrice
      };

      // Sign and send transaction
      const signedTx = await this.walletService.signTransaction(merchantId, transactionData);
      const receipt = await this.walletService.sendSignedTransaction(signedTx);

      // Extract token ID from logs
      const tokenId = this.extractTokenIdFromReceipt(receipt);

      return {
        success: true,
        tokenId: tokenId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed
      };

    } catch (error) {
      console.error('Error adding diamond to blockchain:', error);
      throw error;
    }
  }

  // Create loan request on blockchain
  async createLoanRequest(lenderMerchantId, borrowerMerchantId, diamondTokenId, loanTerms) {
    try {
      const lenderWallet = this.walletService.getMerchantWallet(lenderMerchantId);
      const borrowerWallet = this.walletService.getMerchantWallet(borrowerMerchantId);
      
      if (!lenderWallet || !borrowerWallet) {
        throw new Error('Merchant wallet(s) not found');
      }

      // Generate QR code data for borrower approval
      const qrData = this.walletService.generateQRData({
        type: 'LOAN_REQUEST',
        loanId: null, // Will be set after transaction
        diamondTokenId: diamondTokenId,
        lender: lenderWallet.address,
        borrower: borrowerWallet.address,
        duration: loanTerms.duration,
        terms: loanTerms.terms || ''
      });

      // Prepare smart contract transaction
      const tx = this.diamondLendingContract.methods.createLoanRequest(
        diamondTokenId,
        borrowerWallet.address,
        loanTerms.duration,
        loanTerms.terms || '',
        qrData.hash
      );

      const gasEstimate = await tx.estimateGas({ from: lenderWallet.address });

      const transactionData = {
        from: lenderWallet.address,
        to: config.contracts.diamondLending,
        data: tx.encodeABI(),
        gas: gasEstimate,
        gasPrice: config.quorum.gasPrice
      };

      // Sign and send transaction
      const signedTx = await this.walletService.signTransaction(lenderMerchantId, transactionData);
      const receipt = await this.walletService.sendSignedTransaction(signedTx);

      // Extract loan ID from logs
      const loanId = this.extractLoanIdFromReceipt(receipt);

      // Update QR data with actual loan ID
      qrData.qrData.loanId = loanId;
      qrData.qrString = JSON.stringify(qrData.qrData);

      return {
        success: true,
        loanId: loanId,
        qrCode: qrData,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Error creating loan request:', error);
      throw error;
    }
  }

  // Approve loan request (called when QR code is scanned)
  async approveLoanRequest(borrowerMerchantId, loanId, qrCodeData) {
    try {
      const borrowerWallet = this.walletService.getMerchantWallet(borrowerMerchantId);
      if (!borrowerWallet) {
        throw new Error('Borrower wallet not found');
      }

      // Verify QR code
      const verification = this.walletService.verifyQRData(
        JSON.stringify(qrCodeData), 
        qrCodeData.hash
      );

      if (!verification.valid) {
        throw new Error(`Invalid QR code: ${verification.error}`);
      }

      // Prepare smart contract transaction
      const tx = this.diamondLendingContract.methods.approveLoanRequest(
        loanId,
        qrCodeData.hash
      );

      const gasEstimate = await tx.estimateGas({ from: borrowerWallet.address });

      const transactionData = {
        from: borrowerWallet.address,
        to: config.contracts.diamondLending,
        data: tx.encodeABI(),
        gas: gasEstimate,
        gasPrice: config.quorum.gasPrice
      };

      // Sign and send transaction
      const signedTx = await this.walletService.signTransaction(borrowerMerchantId, transactionData);
      const receipt = await this.walletService.sendSignedTransaction(signedTx);

      return {
        success: true,
        loanId: loanId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Error approving loan request:', error);
      throw error;
    }
  }

  // Place offer on borrowed diamond
  async placeOffer(buyerMerchantId, loanId, offerAmount, expirationDays, message) {
    try {
      const buyerWallet = this.walletService.getMerchantWallet(buyerMerchantId);
      if (!buyerWallet) {
        throw new Error('Buyer wallet not found');
      }

      const tx = this.diamondLendingContract.methods.placeOffer(
        loanId,
        this.web3.utils.toWei(offerAmount.toString(), 'ether'),
        expirationDays,
        message || ''
      );

      const gasEstimate = await tx.estimateGas({ from: buyerWallet.address });

      const transactionData = {
        from: buyerWallet.address,
        to: config.contracts.diamondLending,
        data: tx.encodeABI(),
        gas: gasEstimate,
        gasPrice: config.quorum.gasPrice
      };

      const signedTx = await this.walletService.signTransaction(buyerMerchantId, transactionData);
      const receipt = await this.walletService.sendSignedTransaction(signedTx);

      const offerId = this.extractOfferIdFromReceipt(receipt);

      return {
        success: true,
        offerId: offerId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Error placing offer:', error);
      throw error;
    }
  }

  // Accept offer (lender accepts buyer's offer)
  async acceptOffer(lenderMerchantId, offerId) {
    try {
      const lenderWallet = this.walletService.getMerchantWallet(lenderMerchantId);
      if (!lenderWallet) {
        throw new Error('Lender wallet not found');
      }

      const tx = this.diamondLendingContract.methods.acceptOffer(offerId);

      const gasEstimate = await tx.estimateGas({ from: lenderWallet.address });

      const transactionData = {
        from: lenderWallet.address,
        to: config.contracts.diamondLending,
        data: tx.encodeABI(),
        gas: gasEstimate,
        gasPrice: config.quorum.gasPrice
      };

      const signedTx = await this.walletService.signTransaction(lenderMerchantId, transactionData);
      const receipt = await this.walletService.sendSignedTransaction(signedTx);

      return {
        success: true,
        offerId: offerId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  }

  // Return diamond
  async returnDiamond(merchantId, loanId) {
    try {
      const wallet = this.walletService.getMerchantWallet(merchantId);
      if (!wallet) {
        throw new Error('Merchant wallet not found');
      }

      const tx = this.diamondLendingContract.methods.returnDiamond(loanId);

      const gasEstimate = await tx.estimateGas({ from: wallet.address });

      const transactionData = {
        from: wallet.address,
        to: config.contracts.diamondLending,
        data: tx.encodeABI(),
        gas: gasEstimate,
        gasPrice: config.quorum.gasPrice
      };

      const signedTx = await this.walletService.signTransaction(merchantId, transactionData);
      const receipt = await this.walletService.sendSignedTransaction(signedTx);

      return {
        success: true,
        loanId: loanId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Error returning diamond:', error);
      throw error;
    }
  }

  // Get diamond information from blockchain
  async getDiamond(tokenId) {
    try {
      if (!this.diamondLendingContract) {
        throw new Error('Contract not initialized');
      }

      const diamond = await this.diamondLendingContract.methods.getDiamond(tokenId).call();
      
      return {
        tokenId: diamond.tokenId,
        certificateNumber: diamond.certificateNumber,
        weight: diamond.weight / 100, // Convert back from smallest unit
        shape: diamond.shape,
        color: diamond.color,
        clarity: diamond.clarity,
        cut: diamond.cut,
        polish: diamond.polish,
        symmetry: diamond.symmetry,
        uv: diamond.uv,
        cost: this.web3.utils.fromWei(diamond.cost, 'ether'),
        supplier: diamond.supplier,
        buyingDate: new Date(diamond.buyingDate * 1000),
        expenses: this.web3.utils.fromWei(diamond.expenses, 'ether'),
        owner: diamond.owner,
        isAvailable: diamond.isAvailable
      };

    } catch (error) {
      console.error('Error getting diamond:', error);
      throw error;
    }
  }

  // Get loan information from blockchain
  async getLoan(loanId) {
    try {
      if (!this.diamondLendingContract) {
        throw new Error('Contract not initialized');
      }

      const loan = await this.diamondLendingContract.methods.getLoan(loanId).call();
      
      return {
        loanId: loan.loanId,
        diamondTokenId: loan.diamondTokenId,
        borrower: loan.borrower,
        lender: loan.lender,
        loanDuration: loan.loanDuration,
        createdAt: new Date(loan.createdAt * 1000),
        approvedAt: loan.approvedAt > 0 ? new Date(loan.approvedAt * 1000) : null,
        status: this.getLoanStatusString(loan.status),
        terms: loan.terms
      };

    } catch (error) {
      console.error('Error getting loan:', error);
      throw error;
    }
  }

  // Extract token ID from transaction receipt
  extractTokenIdFromReceipt(receipt) {
    try {
      // Look for DiamondAdded event in logs
      for (const log of receipt.logs) {
        if (log.topics[0] === this.web3.utils.keccak256('DiamondAdded(uint256,address,string)')) {
          return parseInt(log.topics[1], 16);
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting token ID:', error);
      return null;
    }
  }

  // Extract loan ID from transaction receipt
  extractLoanIdFromReceipt(receipt) {
    try {
      // Look for LoanRequested event in logs
      for (const log of receipt.logs) {
        if (log.topics[0] === this.web3.utils.keccak256('LoanRequested(uint256,uint256,address,bytes32)')) {
          return parseInt(log.topics[1], 16);
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting loan ID:', error);
      return null;
    }
  }

  // Extract offer ID from transaction receipt
  extractOfferIdFromReceipt(receipt) {
    try {
      // Look for OfferPlaced event in logs
      for (const log of receipt.logs) {
        if (log.topics[0] === this.web3.utils.keccak256('OfferPlaced(uint256,uint256,address,uint256)')) {
          return parseInt(log.topics[1], 16);
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting offer ID:', error);
      return null;
    }
  }

  // Convert loan status enum to string
  getLoanStatusString(status) {
    const statuses = ['PENDING', 'ACTIVE', 'SOLD', 'RETURNED', 'CANCELLED'];
    return statuses[status] || 'UNKNOWN';
  }

  // Get user's loans
  async getUserLoans(merchantId) {
    try {
      const wallet = this.walletService.getMerchantWallet(merchantId);
      if (!wallet) {
        throw new Error('Merchant wallet not found');
      }

      const loanIds = await this.diamondLendingContract.methods.getUserLoans(wallet.address).call();
      
      const loans = [];
      for (const loanId of loanIds) {
        const loan = await this.getLoan(loanId);
        loans.push(loan);
      }

      return loans;
    } catch (error) {
      console.error('Error getting user loans:', error);
      throw error;
    }
  }

  // Get user's offers
  async getUserOffers(merchantId) {
    try {
      const wallet = this.walletService.getMerchantWallet(merchantId);
      if (!wallet) {
        throw new Error('Merchant wallet not found');
      }

      const offerIds = await this.diamondLendingContract.methods.getUserOffers(wallet.address).call();
      
      const offers = [];
      for (const offerId of offerIds) {
        const offer = await this.diamondLendingContract.methods.getOffer(offerId).call();
        offers.push({
          offerId: offer.offerId,
          loanId: offer.loanId,
          buyer: offer.buyer,
          offerAmount: this.web3.utils.fromWei(offer.offerAmount, 'ether'),
          createdAt: new Date(offer.createdAt * 1000),
          expiresAt: new Date(offer.expiresAt * 1000),
          status: this.getOfferStatusString(offer.status),
          message: offer.message
        });
      }

      return offers;
    } catch (error) {
      console.error('Error getting user offers:', error);
      throw error;
    }
  }

  // Convert offer status enum to string
  getOfferStatusString(status) {
    const statuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
    return statuses[status] || 'UNKNOWN';
  }
}

module.exports = ContractService;