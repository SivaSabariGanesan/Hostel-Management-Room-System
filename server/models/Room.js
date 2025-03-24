import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  department: {
    type: String,
    default: null
  },
  occupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isOccupied: {
    type: Boolean,
    default: false
  },
  hasAttachedBathroom: {
    type: Boolean,
    default: false
  },
  hasAC: {
    type: Boolean,
    default: false
  },
  fees: {
    type: Number,
    default: 70000 // Base fee
  }
}, {
  timestamps: true
});

// Calculate fees based on amenities
roomSchema.pre('save', function(next) {
  this.isOccupied = this.currentOccupancy >= this.capacity;
  
  // Calculate total fees
  let totalFees = 70000; // Base fee
  if (this.hasAttachedBathroom) totalFees += 21000;
  if (this.hasAC) totalFees += 40000;
  this.fees = totalFees;
  
  next();
});

export default mongoose.model('Room', roomSchema);