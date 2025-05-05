// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Diamond } = require('./models/Diamond');
const { Contract } = require('./models/Contract');


dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let currentUser = { id: 1, name: 'Roni', email: 'roni@example.com' };


// Diamonds
app.get('/api/diamonds', async (req, res) => {
  const diamonds = await Diamond.find();
  res.json(diamonds);
});


app.post('/api/diamonds', async (req, res) => {
  const diamond = new Diamond(req.body);
  await diamond.save();
  res.status(201).json(diamond);
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


// Contracts
app.get('/api/contracts', async (req, res) => {
  const contracts = await Contract.find().populate('diamondId');
  res.json(contracts);
});

app.post('/api/contracts', async (req, res) => {
  try {
    const contract = new Contract(req.body);
    await contract.save();
    res.status(201).json(contract);
  } catch (error) {
    console.error("Error creating contract:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Authentication (mocked)
app.post('/api/login', (req, res) => {
  res.json(currentUser);
});

app.post('/api/logout', (req, res) => {
  res.status(204).send();
});

app.get('/api/me', (req, res) => {
  res.json(currentUser);
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
