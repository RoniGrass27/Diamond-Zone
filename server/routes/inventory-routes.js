const express = require('express');
const router = express.Router();
const { Diamond } = require('../models/Diamond');
const { Contract } = require('../models/Contract');
const { protect } = require('../middleware/auth');

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Inventory route working' });
});

// Get user's inventory (owned diamonds + diamonds accessible through contracts)
router.get('/my-inventory', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get diamonds the user owns directly
    const ownedDiamonds = await Diamond.find({ ownerId: userId });

    // Get APPROVED memo contracts where user is the buyer (to show diamonds they can access)
    const buyerContracts = await Contract.find({
      buyerEmail: userEmail,
      type: { $in: ['MemoFrom', 'MemoTo'] },
      status: 'approved'
    });

    // Get APPROVED memo contracts where user is the seller (to show diamonds they've lent out)
    const sellerContracts = await Contract.find({
      sellerEmail: userEmail,
      type: { $in: ['MemoFrom', 'MemoTo'] },
      status: 'approved'
    });

    // Get diamond IDs from buyer contracts
    const buyerDiamondIds = buyerContracts.map(contract => contract.diamondId);

    // Get diamonds accessible through contracts (for buyers)
    const contractDiamonds = await Diamond.find({
      _id: { $in: buyerDiamondIds }
    });

    // Combine and format the results
    const inventory = [
      // Owned diamonds - show status based on active contracts
      ...ownedDiamonds.map(diamond => {
        // Check if this diamond has an APPROVED memo contract where user is seller
        const sellerContract = sellerContracts.find(c => 
          c.diamondId.toString() === diamond._id.toString()
        );

        let displayStatus = diamond.status;
        
        // If user owns the diamond and it's in an APPROVED memo contract, show "Memo From"
        if (sellerContract && sellerContract.status === 'approved') {
          displayStatus = 'Memo From'; // Seller sees "Memo From" 
        }

        return {
          ...diamond.toObject(),
          accessType: 'owned',
          displayStatus: displayStatus,
          id: diamond._id || diamond.id
        };
      }),
      
      // Contract-accessible diamonds (for buyers) - show "Memo To"
      ...contractDiamonds.map(diamond => {
        const contract = buyerContracts.find(c => 
          c.diamondId.toString() === diamond._id.toString()
        );
        
        return {
          ...diamond.toObject(),
          accessType: 'contract',
          displayStatus: 'Memo To', // Always "Memo To" for buyers (same as displayInfo.direction)
          contractId: contract._id,
          contractType: contract.type, // This will be "MemoFrom" or "MemoTo"
          contractNumber: contract.contractNumber,
          duration: contract.duration,
          terms: contract.terms,
          expirationDate: contract.expirationDate,
          counterparty: contract.sellerEmail,
          id: diamond._id || diamond.id
        };
      })
    ];

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Approve a contract and update diamond status
router.post('/approve-contract/:contractId', protect, async (req, res) => {
  try {
    const { contractId } = req.params;
    const userEmail = req.user.email;

    // Find the contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user can approve this contract
    if (!contract.canApprove(userEmail)) {
      return res.status(403).json({ error: 'You cannot approve this contract' });
    }

    // Redirect to the main contract approval endpoint
    // This ensures all contract approvals go through the unified logic
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/contracts/${contractId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${req.headers.authorization}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      res.json(result);
    } else {
      res.status(response.status).json({ error: 'Failed to approve contract' });
    }
  } catch (error) {
    console.error('Error approving contract:', error);
    res.status(500).json({ error: 'Failed to approve contract' });
  }
});

// Delete a diamond (only if status is "In Stock")
router.delete('/diamonds/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the diamond and check ownership
    const diamond = await Diamond.findOne({ 
      _id: id, 
      ownerId: userId 
    });

    if (!diamond) {
      return res.status(404).json({ error: 'Diamond not found or you do not own it' });
    }

    // Check if diamond can be deleted (only "In Stock" diamonds)
    if (diamond.status !== 'In Stock') {
      return res.status(400).json({ 
        error: `Cannot delete diamond with status "${diamond.status}". Only diamonds with "In Stock" status can be deleted.` 
      });
    }

    // Delete the diamond
    await Diamond.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: `Diamond #${diamond.diamondNumber || id.substring(0, 3)} has been successfully deleted` 
    });
  } catch (error) {
    console.error('Error deleting diamond:', error);
    res.status(500).json({ error: 'Failed to delete diamond' });
  }
});

module.exports = router;
