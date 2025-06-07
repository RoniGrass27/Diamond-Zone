const express = require('express');
const { User } = require('../models/User');
const { Message } = require('../models/Message');
const { generateToken, protect } = require('../middleware/auth');

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, businessName, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      fullName,
      businessName,
      phone,
      address,
      role: 'merchant'
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      walletCreated: user.walletCreated,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join('. ') });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account has been deactivated' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      walletCreated: user.walletCreated,
      walletAddress: user.walletAddress,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get unread message count
    const unreadCount = await Message.getUnreadCount(user._id);

    const userData = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      walletCreated: user.walletCreated,
      walletAddress: user.walletAddress,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      unreadMessages: unreadCount
    };

    res.json(userData);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error getting profile' });
  }
});

// Update user profile
router.put('/me', protect, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates.walletAddress;
    delete updates.walletCreated;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        walletCreated: user.walletCreated,
        walletAddress: user.walletAddress,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join('. ') });
    }

    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

// Enable blockchain wallet
router.post('/enable-blockchain', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.walletCreated) {
      return res.json({
        success: true,
        message: 'Wallet already exists',
        wallet: {
          address: user.walletAddress,
          createdAt: user.updatedAt
        }
      });
    }

    // Create wallet using blockchain service
    const WalletService = require('../blockchain/WalletService');
    const walletService = new WalletService();
    
    const wallet = await walletService.createMerchantWallet(user._id.toString());
    
    // Update user record
    user.walletCreated = true;
    user.walletAddress = wallet.address;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Blockchain wallet enabled successfully',
      wallet: {
        address: wallet.address,
        createdAt: wallet.createdAt
      }
    });

  } catch (error) {
    console.error('Enable blockchain error:', error);
    res.status(500).json({ error: 'Server error enabling blockchain wallet' });
  }
});

// Logout (client-side mainly, but can be used for logging)
router.post('/logout', protect, async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just return success and let client handle token removal
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

module.exports = router;