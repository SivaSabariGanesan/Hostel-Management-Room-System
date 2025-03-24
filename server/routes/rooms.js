import express from 'express';
import jwt from 'jsonwebtoken';
import Room from '../models/Room.js';
import User from '../models/User.js';

const router = express.Router();

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().populate('occupants', 'name email');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new room (Warden only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'warden' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { roomNumber, capacity, hasAttachedBathroom, hasAC } = req.body;
    const roomExists = await Room.findOne({ roomNumber });

    if (roomExists) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = new Room({
      roomNumber,
      capacity,
      hasAttachedBathroom: hasAttachedBathroom || false,
      hasAC: hasAC || false,
      currentOccupancy: 0,
      occupants: []
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room (Warden only)
router.put('/:roomId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'warden' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isOccupied) {
      return res.status(400).json({ message: 'Cannot edit occupied room' });
    }

    const { roomNumber, capacity, hasAttachedBathroom, hasAC } = req.body;
    
    // Check if new room number already exists
    if (roomNumber !== room.roomNumber) {
      const roomExists = await Room.findOne({ roomNumber });
      if (roomExists) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    room.roomNumber = roomNumber;
    room.capacity = capacity;
    room.hasAttachedBathroom = hasAttachedBathroom;
    room.hasAC = hasAC;
    await room.save();

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove occupant from room (Warden only)
router.post('/:roomId/remove-occupant', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'warden' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { userId } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const occupantIndex = room.occupants.indexOf(userId);
    if (occupantIndex === -1) {
      return res.status(400).json({ message: 'Student not found in room' });
    }

    room.occupants.splice(occupantIndex, 1);
    room.currentOccupancy = room.occupants.length;
    room.isOccupied = room.currentOccupancy >= room.capacity;

    // If room is empty, reset department
    if (room.occupants.length === 0) {
      room.department = null;
    }

    await room.save();
    
    // Populate the updated room with occupant details
    const updatedRoom = await Room.findById(room._id).populate('occupants', 'name email');
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's current room
router.get('/my-room', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const room = await Room.findOne({ occupants: req.user._id })
      .populate('occupants', 'name email');

    if (!room) {
      return res.status(404).json({ message: 'No room assigned' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available rooms for student based on fees paid
router.get('/available', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const feesPaid = req.user.feesPaid || 0;
    const rooms = await Room.find({ isOccupied: false });

    // Filter rooms based on fees paid
    const availableRooms = rooms.filter(room => {
      let requiredFees = 70000; // Base fee
      if (room.hasAttachedBathroom) requiredFees += 21000;
      if (room.hasAC) requiredFees += 40000;
      return feesPaid >= requiredFees;
    });

    res.json(availableRooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Book a room
router.post('/:roomId/book', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can book rooms' });
    }

    const room = await Room.findById(req.params.roomId)
      .populate('occupants', 'name email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isOccupied) {
      return res.status(400).json({ message: 'Room is already full' });
    }

    // Check if student already has a room
    const existingRoom = await Room.findOne({ occupants: req.user._id });
    if (existingRoom) {
      return res.status(400).json({ message: 'You already have a room assigned' });
    }

    // Check department compatibility
    if (room.department && room.department !== req.user.department) {
      return res.status(400).json({ message: 'Room is reserved for a different department' });
    }

    // Calculate required fees for the room
    let requiredFees = 70000; // Base fee
    if (room.hasAttachedBathroom) requiredFees += 21000;
    if (room.hasAC) requiredFees += 40000;

    // Check if student has paid enough fees
    if (req.user.feesPaid < requiredFees) {
      // Check what type of room the student can afford
      let affordableRoomType = 'a basic room';
      if (req.user.feesPaid >= 131000) {
        affordableRoomType = 'a room with both AC and attached bathroom';
      } else if (req.user.feesPaid >= 110000) {
        affordableRoomType = 'a room with AC';
      } else if (req.user.feesPaid >= 91000) {
        affordableRoomType = 'a room with attached bathroom';
      }

      return res.status(400).json({ 
        message: `With your current fee payment of ₹${req.user.feesPaid.toLocaleString()}, you can only book ${affordableRoomType}. This room requires ₹${requiredFees.toLocaleString()}.`
      });
    }

    // If room is empty, set department
    if (room.occupants.length === 0) {
      room.department = req.user.department;
    }

    room.occupants.push(req.user._id);
    room.currentOccupancy = room.occupants.length;
    room.isOccupied = room.currentOccupancy >= room.capacity;

    await room.save();
    
    // Populate the updated room with occupant details
    const updatedRoom = await Room.findById(room._id).populate('occupants', 'name email');
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;