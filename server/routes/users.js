import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Middleware to verify JWT token and admin role
const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all users (Admin only)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user (Admin only)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, role, department, year, feesPaid } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      ...(role === 'student' && { 
        department, 
        year,
        feesPaid: feesPaid || 70000 // Default to base fee if not specified
      })
    });

    await user.save();
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      feesPaid: user.feesPaid
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (Admin only)
router.put('/:userId', adminMiddleware, async (req, res) => {
  try {
    const { name, email, role, department, year, feesPaid, password } = req.body;
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user fields
    user.name = name;
    user.email = email;
    user.role = role;
    
    if (role === 'student') {
      user.department = department;
      user.year = year;
      user.feesPaid = feesPaid;
    } else {
      user.department = undefined;
      user.year = undefined;
      user.feesPaid = undefined;
    }

    // Only update password if provided
    if (password) {
      user.password = password;
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      feesPaid: user.feesPaid
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:userId', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk create users (Admin only)
router.post('/bulk', adminMiddleware, async (req, res) => {
  try {
    const { users } = req.body;
    const createdUsers = await User.create(
      users.map(user => ({
        ...user,
        ...(user.role === 'student' && { feesPaid: user.feesPaid || 70000 })
      }))
    );
    
    res.status(201).json(
      createdUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        feesPaid: user.feesPaid
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;