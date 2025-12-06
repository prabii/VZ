import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  // Account Details
  accountNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  bookDate: {
    type: Date,
    default: Date.now
  },
  
  // Contact Information
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
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
customerSchema.index({ accountNo: 1 });
customerSchema.index({ clientName: 1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
