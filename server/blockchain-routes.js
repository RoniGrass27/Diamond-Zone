// server/blockchain-routes.js
const express = require('express');
const WalletService = require('./blockchain/WalletService.js');
const ContractService = require('./blockchain/ContractService.js');

const router = express.Router();

// Initialize services
const walletService = new WalletService();
const contractService = new ContractService(walletService);

// Wallet management routes
router.post('/wallet/create', async (req, res) => {
  try {
    const { merchantId } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({ error: 'Merchant ID is required' });
    }

    const wallet = await walletService.createMerchantWallet(merchantId);
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/wallet/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const wallet = walletService.getMerchantWallet(merchantId);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Return wallet info without private key
    res.json({
      address: wallet.address,
      merchantId: wallet.merchantId,
      createdAt: wallet.createdAt
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/wallet/:merchantId/balance', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const balance = await walletService.getWalletBalance(merchantId);
    res.json({ balance });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Diamond blockchain routes
router.post('/diamond/add', async (req, res) => {
  try {
    const { merchantId, diamondData } = req.body;
    
    if (!merchantId || !diamondData) {
      return res.status(400).json({ error: 'Merchant ID and diamond data are required' });
    }

    const result = await contractService.addDiamondToBlockchain(merchantId, diamondData);
    res.json(result);
  } catch (error) {
    console.error('Error adding diamond to blockchain:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/diamond/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const diamond = await contractService.getDiamond(tokenId);
    res.json(diamond);
  } catch (error) {
    console.error('Error getting diamond from blockchain:', error);
    res.status(500).json({ error: error.message });
  }
});

// Loan management routes
router.post('/loan/create', async (req, res) => {
  try {
    const { lenderMerchantId, borrowerMerchantId, diamondTokenId, loanTerms } = req.body;
    
    if (!lenderMerchantId || !borrowerMerchantId || !diamondTokenId || !loanTerms) {
      return res.status(400).json({ error: 'All loan parameters are required' });
    }

    const result = await contractService.createLoanRequest(
      lenderMerchantId, 
      borrowerMerchantId, 
      diamondTokenId, 
      loanTerms
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error creating loan request:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loan/approve', async (req, res) => {
  try {
    const { borrowerMerchantId, loanId, qrCodeData } = req.body;
    
    if (!borrowerMerchantId || !loanId || !qrCodeData) {
      return res.status(400).json({ error: 'Borrower ID, loan ID, and QR code data are required' });
    }

    const result = await contractService.approveLoanRequest(borrowerMerchantId, loanId, qrCodeData);
    res.json(result);
  } catch (error) {
    console.error('Error approving loan request:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loan/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    const loan = await contractService.getLoan(loanId);
    res.json(loan);
  } catch (error) {
    console.error('Error getting loan:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loans/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const loans = await contractService.getUserLoans(merchantId);
    res.json(loans);
  } catch (error) {
    console.error('Error getting user loans:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loan/return', async (req, res) => {
  try {
    const { merchantId, loanId } = req.body;
    
    if (!merchantId || !loanId) {
      return res.status(400).json({ error: 'Merchant ID and loan ID are required' });
    }

    const result = await contractService.returnDiamond(merchantId, loanId);
    res.json(result);
  } catch (error) {
    console.error('Error returning diamond:', error);
    res.status(500).json({ error: error.message });
  }
});

// Offer management routes
router.post('/offer/place', async (req, res) => {
  try {
    const { buyerMerchantId, loanId, offerAmount, expirationDays, message } = req.body;
    
    if (!buyerMerchantId || !loanId || !offerAmount) {
      return res.status(400).json({ error: 'Buyer ID, loan ID, and offer amount are required' });
    }

    const result = await contractService.placeOffer(
      buyerMerchantId, 
      loanId, 
      offerAmount, 
      expirationDays || 7, 
      message
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error placing offer:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/offer/accept', async (req, res) => {
  try {
    const { lenderMerchantId, offerId } = req.body;
    
    if (!lenderMerchantId || !offerId) {
      return res.status(400).json({ error: 'Lender ID and offer ID are required' });
    }

    const result = await contractService.acceptOffer(lenderMerchantId, offerId);
    res.json(result);
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/offers/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const offers = await contractService.getUserOffers(merchantId);
    res.json(offers);
  } catch (error) {
    console.error('Error getting user offers:', error);
    res.status(500).json({ error: error.message });
  }
});

// QR Code generation and verification
router.post('/qr/generate', async (req, res) => {
  try {
    const { transactionData } = req.body;
    
    if (!transactionData) {
      return res.status(400).json({ error: 'Transaction data is required' });
    }

    const qrData = walletService.generateQRData(transactionData);
    res.json(qrData);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/qr/verify', async (req, res) => {
  try {
    const { qrString, expectedHash } = req.body;
    
    if (!qrString || !expectedHash) {
      return res.status(400).json({ error: 'QR string and expected hash are required' });
    }

    const verification = walletService.verifyQRData(qrString, expectedHash);
    res.json(verification);
  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Development/testing routes
router.post('/wallet/import', async (req, res) => {
  try {
    const { merchantId, privateKey } = req.body;
    
    if (!merchantId || !privateKey) {
      return res.status(400).json({ error: 'Merchant ID and private key are required' });
    }

    const wallet = await walletService.importWallet(merchantId, privateKey);
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Error importing wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/wallets', async (req, res) => {
  try {
    const wallets = walletService.getAllMerchantWallets();
    res.json(wallets);
  } catch (error) {
    console.error('Error getting all wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;