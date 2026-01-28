import mongoose from 'mongoose';

const priceSheetItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  hsnCode: {
    type: String,
    trim: true
  },
  weight: {
    type: String,
    trim: true
  },
  rate: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  destination: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    index: true
  },
  countryCode: {
    type: String,
    trim: true
  },
  serviceType: {
    type: String,
    trim: true
  },
  // Additional fields for flexibility
  additionalInfo: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { _id: true });

const priceSheetSchema = new mongoose.Schema({
  // Sheet Information
  sheetName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Price Items
  items: {
    type: [priceSheetItemSchema],
    default: []
  },
  
  // File Information
  originalFileName: {
    type: String,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Vendor Assignment
  assignedVendors: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
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

// Indexes
priceSheetSchema.index({ isActive: 1 });
priceSheetSchema.index({ isDefault: 1 });
priceSheetSchema.index({ createdAt: -1 });

// Ensure only one default sheet
priceSheetSchema.pre('save', async function(next) {
  if (this.isDefault && this.isNew) {
    await mongoose.model('PriceSheet').updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const PriceSheet = mongoose.model('PriceSheet', priceSheetSchema);

export default PriceSheet;
