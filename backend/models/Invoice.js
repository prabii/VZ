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

const invoiceItemSchema = new mongoose.Schema({
  boxNo: String,
  description: String,
  hsnCode: String,
  quantity: Number,
  weight: Number,
  rate: Number,
  amount: Number
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  // Invoice Details
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  exporterRef: {
    type: String,
    trim: true
  },
  awbNo: {
    type: String,
    trim: true,
    index: true
  },
  
  // Shipment Details
  pieces: {
    type: String,
    required: true
  },
  weight: String,
  
  // Parties
  shipper: {
    type: shipperDetailsSchema,
    required: true
  },
  consignee: {
    type: consigneeDetailsSchema,
    required: true
  },
  
  // Shipping Details
  preCarriageBy: String,
  portOfReceipt: String,
  vesselFlightNo: String,
  placeOfLoading: {
    type: String,
    required: true
  },
  countryOfOrigin: {
    type: String,
    required: true
  },
  portOfDischarge: {
    type: String,
    required: true
  },
  finalDestination: {
    type: String,
    required: true
  },
  countryOfDestination: {
    type: String,
    required: true
  },
  otherReference: String,
  termOfDelivery: String,
  
  // Items
  items: {
    type: [invoiceItemSchema],
    required: true
  },
  
  // Financial
  totalAmount: {
    type: Number,
    required: true
  },
  gstNo: {
    type: String,
    default: '37HVGPP7046R1ZG'
  },
  
  // Customer Reference
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  accountNo: {
    type: String,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'cancelled'],
    default: 'issued'
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

// Indexes for faster queries
invoiceSchema.index({ invoiceNo: 1 });
invoiceSchema.index({ awbNo: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ accountNo: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
