import mongoose from 'mongoose';

const shipperDetailsSchema = new mongoose.Schema({
  companyName: String,
  contactName: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  telephone: String,
  mobileNo: String,
  email: String,
  documentType: String,
  documentNo: String
}, { _id: false });

const consigneeDetailsSchema = new mongoose.Schema({
  companyName: String,
  contactName: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  telephone: String,
  mobileNo: String,
  email: String
}, { _id: false });

const awbSchema = new mongoose.Schema({
  // AWB Details
  awbNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  accountNo: {
    type: String,
    required: true,
    index: true
  },
  customer: {
    type: String,
    required: true
  },
  
  // Route Information
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  bookingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Company Information
  companyName: {
    type: String,
    default: 'VISAKHA INTERNATIONAL COURIERS'
  },
  website: {
    type: String,
    default: 'WWW.VISAKHACOURIERS.COM'
  },
  email: {
    type: String,
    default: 'INFO@VISAKHACOURIERS.COM'
  },
  
  // Parties
  shipper: {
    type: shipperDetailsSchema,
    required: true
  },
  consignee: {
    type: consigneeDetailsSchema,
    required: true
  },
  
  // Shipment Details
  description: {
    type: String,
    default: 'Personal Effects / Gifts'
  },
  pieces: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    required: true
  },
  chargeableWeight: String,
  volumetricWeight: String,
  dimensions: String,
  
  // Financial
  shipmentValue: String,
  paymentMethod: {
    type: String,
    required: true
  },
  invoiceNo: {
    type: String,
    index: true
  },
  
  // Additional Details
  routingCode: String,
  ewayBillNo: String,
  gstNo: {
    type: String,
    required: true
  },
  
  // Customer Reference
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  
  // Tracking Status
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Tracking History
  trackingHistory: [{
    status: {
      type: String,
      required: true
    },
    location: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: String
  }],
  
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

// Indexes for faster queries
awbSchema.index({ awbNo: 1 });
awbSchema.index({ accountNo: 1 });
awbSchema.index({ status: 1 });
awbSchema.index({ bookingDate: -1 });
awbSchema.index({ customerId: 1 });

const AWB = mongoose.model('AWB', awbSchema);

export default AWB;
