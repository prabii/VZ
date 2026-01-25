# Quotation Documentation - Visakha International Couriers

## 📋 Overview

This documentation describes the Quotation system for the Visakha International Couriers platform. A quotation is a preliminary pricing document sent to customers before they confirm a shipment, allowing them to review costs and terms before booking.

---

## 🎯 Purpose

Quotations serve the following purposes:
- **Price Estimation**: Provide customers with estimated shipping costs
- **Service Comparison**: Allow customers to compare different service options
- **Booking Preparation**: Help customers prepare for shipment booking
- **Record Keeping**: Maintain a history of pricing quotes for reference

---

## 📊 Database Schema

### Quotation Model

```javascript
{
  // Quotation Details
  quotationNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: () => `QT-${Date.now()}`
  },
  quotationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  
  // Customer Reference
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  accountNo: String,
  
  // Shipment Details
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    enum: ['Express', 'Standard', 'Economy', 'International'],
    default: 'Standard'
  },
  weight: {
    type: Number,
    required: true
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'g', 'lb'],
    default: 'kg'
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'm', 'in'],
      default: 'cm'
    }
  },
  pieces: {
    type: Number,
    default: 1
  },
  
  // Parties
  shipper: {
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
  },
  consignee: {
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
  },
  
  // Pricing Breakdown
  baseRate: {
    type: Number,
    required: true
  },
  fuelSurcharge: {
    type: Number,
    default: 0
  },
  handlingCharges: {
    type: Number,
    default: 0
  },
  insurance: {
    type: Number,
    default: 0
  },
  customsClearance: {
    type: Number,
    default: 0
  },
  otherCharges: [{
    description: String,
    amount: Number
  }],
  discount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },
  gst: {
    type: Number,
    default: 0
  },
  gstPercentage: {
    type: Number,
    default: 18
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Terms & Conditions
  terms: [String],
  specialInstructions: String,
  deliveryTime: String, // e.g., "3-5 business days"
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'],
    default: 'draft'
  },
  convertedToAWB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AWB'
  },
  
  // Vendor Reference (for vendor users)
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}
```

---

## 🔌 API Endpoints

### Base URL
```
/api/quotations
```

### 1. Create Quotation
**POST** `/api/quotations`

**Request Body:**
```json
{
  "customerId": "507f1f77bcf86cd799439011",
  "accountNo": "ACC001",
  "origin": "Visakhapatnam",
  "destination": "Mumbai",
  "serviceType": "Express",
  "weight": 5.5,
  "weightUnit": "kg",
  "dimensions": {
    "length": 30,
    "width": 20,
    "height": 15,
    "unit": "cm"
  },
  "pieces": 1,
  "shipper": {
    "companyName": "ABC Company",
    "contactName": "John Doe",
    "address1": "123 Main St",
    "city": "Visakhapatnam",
    "state": "Andhra Pradesh",
    "pincode": "530026",
    "country": "India",
    "telephone": "0891-1234567",
    "mobileNo": "9876543210",
    "email": "john@abc.com"
  },
  "consignee": {
    "companyName": "XYZ Corp",
    "contactName": "Jane Smith",
    "address1": "456 Park Ave",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India",
    "telephone": "022-1234567",
    "mobileNo": "9876543211",
    "email": "jane@xyz.com"
  },
  "baseRate": 500,
  "fuelSurcharge": 50,
  "handlingCharges": 25,
  "insurance": 100,
  "otherCharges": [
    {
      "description": "Packaging",
      "amount": 50
    }
  ],
  "discount": 50,
  "discountType": "fixed",
  "gstPercentage": 18,
  "deliveryTime": "2-3 business days",
  "specialInstructions": "Handle with care",
  "terms": [
    "Payment terms: 50% advance, 50% on delivery",
    "Valid for 30 days",
    "Subject to actual weight verification"
  ],
  "vendorId": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "quotationNo": "QT-1704123456789",
  "quotationDate": "2024-01-01T10:30:00.000Z",
  "validUntil": "2024-01-31T10:30:00.000Z",
  "status": "draft",
  "totalAmount": 741.5,
  "message": "Quotation created successfully"
}
```

---

### 2. Get All Quotations
**GET** `/api/quotations`

**Query Parameters:**
- `status` - Filter by status (draft, sent, accepted, rejected, expired, converted)
- `customerId` - Filter by customer ID
- `accountNo` - Filter by account number
- `vendorId` - Filter by vendor ID (for vendor users)
- `userRole` - User role (admin/vendor) for access control
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "quotations": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "quotationNo": "QT-1704123456789",
      "quotationDate": "2024-01-01T10:30:00.000Z",
      "validUntil": "2024-01-31T10:30:00.000Z",
      "status": "sent",
      "origin": "Visakhapatnam",
      "destination": "Mumbai",
      "serviceType": "Express",
      "totalAmount": 741.5,
      "customerId": "507f1f77bcf86cd799439011"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

---

### 3. Get Quotation by ID
**GET** `/api/quotations/:id`

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "quotationNo": "QT-1704123456789",
  "quotationDate": "2024-01-01T10:30:00.000Z",
  "validUntil": "2024-01-31T10:30:00.000Z",
  "status": "sent",
  "origin": "Visakhapatnam",
  "destination": "Mumbai",
  "serviceType": "Express",
  "weight": 5.5,
  "weightUnit": "kg",
  "pieces": 1,
  "shipper": { ... },
  "consignee": { ... },
  "baseRate": 500,
  "fuelSurcharge": 50,
  "handlingCharges": 25,
  "insurance": 100,
  "otherCharges": [...],
  "discount": 50,
  "gst": 133.5,
  "totalAmount": 741.5,
  "currency": "INR",
  "deliveryTime": "2-3 business days",
  "terms": [...],
  "createdAt": "2024-01-01T10:30:00.000Z"
}
```

---

### 4. Get Quotation by Quotation Number
**GET** `/api/quotations/number/:quotationNo`

**Response:** Same as Get Quotation by ID

---

### 5. Update Quotation
**PUT** `/api/quotations/:id`

**Request Body:** (Same as Create, but all fields optional)

**Response:**
```json
{
  "message": "Quotation updated successfully",
  "quotation": { ... }
}
```

---

### 6. Update Quotation Status
**PATCH** `/api/quotations/:id/status`

**Request Body:**
```json
{
  "status": "sent",
  "userRole": "admin"
}
```

**Status Values:**
- `draft` - Quotation is being prepared
- `sent` - Quotation has been sent to customer
- `accepted` - Customer has accepted the quotation
- `rejected` - Customer has rejected the quotation
- `expired` - Quotation validity period has expired
- `converted` - Quotation has been converted to an AWB

**Response:**
```json
{
  "message": "Quotation status updated successfully",
  "quotation": { ... }
}
```

---

### 7. Convert Quotation to AWB
**POST** `/api/quotations/:id/convert-to-awb`

**Request Body:**
```json
{
  "userRole": "admin",
  "bookingDate": "2024-01-15T10:00:00.000Z"
}
```

**Response:**
```json
{
  "message": "Quotation converted to AWB successfully",
  "quotation": { ... },
  "awb": {
    "_id": "507f1f77bcf86cd799439014",
    "awbNo": "V100000001",
    ...
  }
}
```

---

### 8. Delete Quotation
**DELETE** `/api/quotations/:id`

**Query Parameters:**
- `userRole` - User role (only admin can delete)

**Response:**
```json
{
  "message": "Quotation deleted successfully"
}
```

---

### 9. Get Quotations by Customer
**GET** `/api/quotations/customer/:customerId`

**Response:** Array of quotations for the specified customer

---

### 10. Get Quotations by Account Number
**GET** `/api/quotations/account/:accountNo`

**Response:** Array of quotations for the specified account number

---

## 💰 Pricing Calculation

### Formula
```
Subtotal = Base Rate + Fuel Surcharge + Handling Charges + Insurance + Other Charges

Discount Amount = 
  - If discountType is 'percentage': Subtotal × (discount / 100)
  - If discountType is 'fixed': discount

Amount After Discount = Subtotal - Discount Amount

GST = Amount After Discount × (gstPercentage / 100)

Total Amount = Amount After Discount + GST
```

### Example Calculation
```
Base Rate: ₹500
Fuel Surcharge: ₹50
Handling Charges: ₹25
Insurance: ₹100
Other Charges: ₹50
─────────────────────
Subtotal: ₹725

Discount (Fixed): ₹50
─────────────────────
Amount After Discount: ₹675

GST (18%): ₹121.5
─────────────────────
Total Amount: ₹796.5
```

---

## 📄 PDF Generation

### Quotation PDF Structure

1. **Header**
   - Company Logo
   - Company Name: "VISAKHA INTERNATIONAL COURIERS"
   - Address: "7-17-7/2, Opp. Redcherry Bakery, Old Gajuwaka, Visakhapatnam - 530026, Andhra Pradesh, India"
   - Website: "visakhacouriers.in"
   - Email: "Visakhacourier@gmail.com"
   - GST Number: "37HVGPP7046R1ZG"

2. **Quotation Details**
   - Quotation Number
   - Quotation Date
   - Valid Until Date
   - Status

3. **Customer Information**
   - Customer Name/Account Number
   - Contact Details

4. **Shipment Details**
   - Origin & Destination
   - Service Type
   - Weight & Dimensions
   - Number of Pieces
   - Delivery Time

5. **Parties**
   - Shipper Details
   - Consignee Details

6. **Pricing Breakdown**
   - Base Rate
   - Fuel Surcharge
   - Handling Charges
   - Insurance
   - Other Charges (itemized)
   - Discount
   - GST
   - **Total Amount** (highlighted)

7. **Terms & Conditions**
   - List of terms
   - Special Instructions

8. **Footer**
   - GST Number
   - Page Number (if multi-page)

---

## 🎨 Frontend Components

### 1. QuotationEntry Component
- Form to create/edit quotations
- Auto-calculation of pricing
- Preview before saving
- Generate PDF functionality

### 2. QuotationHistory Component
- List of all quotations
- Filter by status, customer, date range
- Search by quotation number
- Actions: View, Edit, Delete, Convert to AWB, Send Email

### 3. QuotationPreview Component
- Display quotation details
- Print/Download PDF
- Accept/Reject buttons (for customer view)

### 4. QuotationCalculator Component
- Quick price estimation tool
- Based on origin, destination, weight, service type
- Real-time calculation

---

## 🔐 Access Control

### Admin Users
- Can create, view, edit, and delete all quotations
- Can convert any quotation to AWB
- Can update quotation status

### Vendor Users
- Can create quotations (automatically linked to their vendorId)
- Can view only their own quotations
- Can edit their own draft quotations
- Cannot delete quotations
- Cannot convert quotations to AWB (admin only)

---

## 📧 Email Integration (Future Enhancement)

### Quotation Email Template
```
Subject: Quotation #QT-1704123456789 - Visakha International Couriers

Dear [Customer Name],

Thank you for your interest in our courier services.

Please find attached the quotation for your shipment:
- Origin: [Origin]
- Destination: [Destination]
- Service Type: [Service Type]
- Total Amount: ₹[Total Amount]

This quotation is valid until [Valid Until Date].

To accept this quotation, please reply to this email or contact us at:
- Email: Visakhacourier@gmail.com
- Website: visakhacouriers.in

Best regards,
Visakha International Couriers
```

---

## 🔄 Workflow

1. **Create Quotation** (Draft)
   - Admin/Vendor creates quotation with pricing details
   - Status: `draft`

2. **Review & Send**
   - Admin reviews and approves quotation
   - Status: `sent`
   - Email sent to customer (optional)

3. **Customer Response**
   - Customer accepts: Status → `accepted`
   - Customer rejects: Status → `rejected`
   - No response after validity: Status → `expired`

4. **Convert to AWB**
   - Admin converts accepted quotation to AWB
   - Status: `converted`
   - New AWB created with quotation details

---

## 📝 Implementation Checklist

### Backend
- [ ] Create `Quotation` model (`VZ/backend/models/Quotation.js`)
- [ ] Create `quotationController.js` with all CRUD operations
- [ ] Create `quotationRoutes.js` with all endpoints
- [ ] Add quotation routes to `server.js`
- [ ] Implement pricing calculation logic
- [ ] Add vendor filtering for vendor users
- [ ] Add admin-only restrictions for delete/convert operations

### Frontend
- [ ] Create `QuotationEntry.tsx` component
- [ ] Create `QuotationHistory.tsx` component
- [ ] Create `QuotationPreview.tsx` component
- [ ] Add quotation API endpoints to `api.ts`
- [ ] Add "Quotations" tab to Admin Dashboard
- [ ] Implement PDF generation for quotations
- [ ] Add quotation calculator component

### PDF Generation
- [ ] Create `generateQuotationPDF` function in `pdfGenerator.ts`
- [ ] Design quotation PDF layout
- [ ] Include all required sections
- [ ] Add company branding

---

## 🧪 Testing

### Test Cases

1. **Create Quotation**
   - Valid data → Success
   - Missing required fields → Error
   - Duplicate quotation number → Error

2. **Get Quotations**
   - Admin → All quotations
   - Vendor → Only own quotations

3. **Update Quotation**
   - Admin → Can update any
   - Vendor → Can update own draft only

4. **Convert to AWB**
   - Admin → Success
   - Vendor → Forbidden

5. **Pricing Calculation**
   - Verify all charges included
   - Verify discount applied correctly
   - Verify GST calculated correctly

---

## 📚 Related Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [AWB Documentation](./models/AWB.js)
- [Invoice Documentation](./models/Invoice.js)
- [PDF Generation Guide](../speedy-visakha-ship/PDF_GENERATION_GUIDE.md)

---

## 📞 Support

For questions or issues regarding quotations:
- Email: Visakhacourier@gmail.com
- Website: visakhacouriers.in

---

**Last Updated:** January 2024
**Version:** 1.0.0
