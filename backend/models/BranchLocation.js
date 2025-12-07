import mongoose from 'mongoose';

const branchLocationSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  // Optional fields for future expansion
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
branchLocationSchema.index({ isActive: 1 });
branchLocationSchema.index({ city: 1 });
branchLocationSchema.index({ state: 1 });

const BranchLocation = mongoose.model('BranchLocation', branchLocationSchema);

export default BranchLocation;

