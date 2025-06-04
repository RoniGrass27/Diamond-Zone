// server.js 
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Diamond } = require('./models/Diamond');
const { Contract } = require('./models/Contract');
const { Counter } = require('./models/counters');

// Import blockchain routes
const blockchainRoutes = require('./blockchain-routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Enhanced current user with blockchain support
let currentUser = { 
  id: 1, 
  name: 'Roni', 
  email: 'roni@example.com', 
  full_name: 'Roni Grass'
};

// Simple in-memory wallet storage (for development)
const userWallets = new Map();

// Add blockchain routes
app.use('/api/blockchain', blockchainRoutes);

// Enhanced user endpoints
app.get('/api/me', (req, res) => {
  const hasWallet = userWallets.has(currentUser.id.toString());
  res.json({
    ...currentUser,
    walletCreated: hasWallet,
    walletAddress: hasWallet ? userWallets.get(currentUser.id.toString()).address : null
  });
});

app.post('/api/users/enable-blockchain', async (req, res) => {
  try {
    const WalletService = require('./blockchain/WalletService');
    const walletService = new WalletService();
    
    if (userWallets.has(currentUser.id.toString())) {
      return res.json({ 
        success: true, 
        message: 'Wallet already exists',
        wallet: userWallets.get(currentUser.id.toString())
      });
    }
    
    const wallet = await walletService.createMerchantWallet(currentUser.id.toString());
    userWallets.set(currentUser.id.toString(), wallet);
    
    res.json({
      success: true,
      message: 'Blockchain enabled successfully',
      wallet: {
        address: wallet.address,
        createdAt: wallet.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error enabling blockchain:', error);
    res.status(500).json({ error: error.message });
  }
});

// Keep all your existing routes (diamonds, contracts, auth) exactly as they are
// ... (copy all your existing routes here)

// Your existing diamond routes
async function getNextDiamondNumber() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'diamond' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

app.get('/api/diamonds', async (req, res) => {
  const diamonds = await Diamond.find();
  res.json(diamonds);
});

app.post('/api/diamonds', async (req, res) => {
  try {
    const diamondNumber = await getNextDiamondNumber();

    const diamond = new Diamond({
      ...req.body,
      diamondNumber
    });

    await diamond.save();
    res.status(201).json(diamond);
  } catch (error) {
    console.error("Error creating diamond:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/diamonds/:id', async (req, res) => {
  const updated = await Diamond.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/diamonds/:id', async (req, res) => {
  await Diamond.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Your existing contract routes
async function getNextContractNumber() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'contract' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

app.get('/api/contracts', async (req, res) => {
  const contracts = await Contract.find().populate('diamondId');
  res.json(contracts);
});

app.post('/api/contracts', async (req, res) => {
  try {
    const contractNumber = await getNextContractNumber();

    const contract = new Contract({
      ...req.body,
      contractNumber: contractNumber
    });    
    
    await contract.save();
    res.status(201).json(contract);
  } catch (error) {
    console.error("Error creating contract:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Your existing auth routes
app.post('/api/login', (req, res) => {
  res.json(currentUser);
});

app.post('/api/logout', (req, res) => {
  res.status(204).send();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      blockchain: 'available'
    }
  });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  - Traditional API: /api/*');
  console.log('  - Blockchain API: /api/blockchain/*');
  console.log('  - Health check: /api/health');
});