import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'warden', 'student'],
    required: true
  },
  department: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  year: {
    type: Number,
    required: function() { return this.role === 'student'; }
  },
  feesPaid: {
    type: Number,
    default: 0,
    required: function() { return this.role === 'student'; }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Create default admin if none exists
userSchema.statics.createDefaultAdmin = async function() {
  try {
    const adminExists = await this.findOne({ role: 'admin' });
    if (!adminExists) {
      await this.create({
        name: 'Admin',
        email: 'admin@hostel.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

const User = mongoose.model('User', userSchema);

// Create default admin on model initialization
User.createDefaultAdmin();

export default User;