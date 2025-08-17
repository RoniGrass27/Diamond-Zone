const express = require('express');
const router = express.Router();
const { Diamond } = require('../models/Diamond');
const { protect } = require('../middleware/auth');

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Inventory route working' });
});

// Get user's inventory (simplified version)
router.get('/my-inventory', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const ownedDiamonds = await Diamond.find({ ownerId: userId });
    
    const inventory = ownedDiamonds.map(diamond => ({
      ...diamond.toObject(),
      accessType: 'owned',
      displayStatus: diamond.status
    }));

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

module.exports = router;
