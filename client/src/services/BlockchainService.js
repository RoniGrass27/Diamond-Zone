// client/src/services/BlockchainService.js
class BlockchainService {
  constructor() {
    this.baseUrl = '/api/blockchain';
  }

  // Wallet management
  async createWallet(merchantId) {
    const response = await fetch(`${this.baseUrl}/wallet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create wallet: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getWallet(merchantId) {
    const response = await fetch(`${this.baseUrl}/wallet/${merchantId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Wallet doesn't exist
      }
      throw new Error(`Failed to get wallet: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getWalletBalance(merchantId) {
    const response = await fetch(`${this.baseUrl}/wallet/${merchantId}/balance`);
    
    if (!response.ok) {
      throw new Error(`Failed to get wallet balance: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Diamond blockchain operations
  async addDiamondToBlockchain(merchantId, diamondData) {
    const response = await fetch(`${this.baseUrl}/diamond/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, diamondData })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add diamond to blockchain: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getDiamondFromBlockchain(tokenId) {
    const response = await fetch(`${this.baseUrl}/diamond/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get diamond from blockchain: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Loan management
  async createLoanRequest(lenderMerchantId, borrowerMerchantId, diamondTokenId, loanTerms) {
    const response = await fetch(`${this.baseUrl}/loan/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lenderMerchantId,
        borrowerMerchantId,
        diamondTokenId,
        loanTerms
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create loan request: ${response.statusText}`);
    }
    
    return response.json();
  }

  async approveLoanRequest(borrowerMerchantId, loanId, qrCodeData) {
    const response = await fetch(`${this.baseUrl}/loan/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        borrowerMerchantId,
        loanId,
        qrCodeData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to approve loan request: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getLoan(loanId) {
    const response = await fetch(`${this.baseUrl}/loan/${loanId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get loan: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getUserLoans(merchantId) {
    const response = await fetch(`${this.baseUrl}/loans/${merchantId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get user loans: ${response.statusText}`);
    }
    
    return response.json();
  }

  async returnDiamond(merchantId, loanId) {
    const response = await fetch(`${this.baseUrl}/loan/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, loanId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to return diamond: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Offer management
  async placeOffer(buyerMerchantId, loanId, offerAmount, expirationDays, message) {
    const response = await fetch(`${this.baseUrl}/offer/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerMerchantId,
        loanId,
        offerAmount,
        expirationDays,
        message
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to place offer: ${response.statusText}`);
    }
    
    return response.json();
  }

  async acceptOffer(lenderMerchantId, offerId) {
    const response = await fetch(`${this.baseUrl}/offer/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lenderMerchantId,
        offerId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to accept offer: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getUserOffers(merchantId) {
    const response = await fetch(`${this.baseUrl}/offers/${merchantId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get user offers: ${response.statusText}`);
    }
    
    return response.json();
  }

  // QR Code operations
  async generateQRCode(transactionData) {
    const response = await fetch(`${this.baseUrl}/qr/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionData })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate QR code: ${response.statusText}`);
    }
    
    return response.json();
  }

  async verifyQRCode(qrString, expectedHash) {
    const response = await fetch(`${this.baseUrl}/qr/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrString, expectedHash })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to verify QR code: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Development/testing functions
  async importWallet(merchantId, privateKey) {
    const response = await fetch(`${this.baseUrl}/wallet/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, privateKey })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to import wallet: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAllWallets() {
    const response = await fetch(`${this.baseUrl}/wallets`);
    
    if (!response.ok) {
      throw new Error(`Failed to get all wallets: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Helper functions
  formatAddress(address, length = 8) {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-4)}`;
  }

  formatAmount(amount, decimals = 4) {
    if (!amount) return '0';
    return parseFloat(amount).toFixed(decimals);
  }

  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Convert diamond data for blockchain
  formatDiamondForBlockchain(diamond) {
    return {
      certificateNumber: diamond.certificateNumber || `CERT-${Date.now()}`,
      weight: diamond.carat || 0,
      shape: diamond.shape || '',
      color: diamond.color || '',
      clarity: diamond.clarity || '',
      cut: diamond.cut || '',
      polish: diamond.polish || '',
      symmetry: diamond.symmetry || '',
      uv: diamond.uv || '',
      cost: diamond.price || 0,
      supplier: diamond.supplier || '',
      buyingDate: diamond.buyingDate || new Date().toISOString(),
      expenses: diamond.expenses || 0
    };
  }

  // Convert blockchain data for frontend
  formatDiamondFromBlockchain(blockchainDiamond) {
    return {
      tokenId: blockchainDiamond.tokenId,
      certificateNumber: blockchainDiamond.certificateNumber,
      carat: blockchainDiamond.weight,
      shape: blockchainDiamond.shape,
      color: blockchainDiamond.color,
      clarity: blockchainDiamond.clarity,
      cut: blockchainDiamond.cut,
      polish: blockchainDiamond.polish,
      symmetry: blockchainDiamond.symmetry,
      uv: blockchainDiamond.uv,
      price: parseFloat(blockchainDiamond.cost),
      supplier: blockchainDiamond.supplier,
      buyingDate: blockchainDiamond.buyingDate,
      expenses: parseFloat(blockchainDiamond.expenses),
      owner: blockchainDiamond.owner,
      isAvailable: blockchainDiamond.isAvailable,
      onBlockchain: true
    };
  }
}

export default new BlockchainService();