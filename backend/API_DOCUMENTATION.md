# VzCourier Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## 📋 Table of Contents
- [Customers API](#customers-api)
- [Invoices API](#invoices-api)
- [AWB/Tracking API](#awbtracking-api)

---

## 👥 Customers API

### Get All Customers
```
GET /api/customers
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by accountNo, clientName, or email
- `status` - Filter by status (active, inactive, suspended)

**Example:**
```
GET /api/customers?page=1&limit=10&search=john&status=active
```

### Get Customer by ID
```
GET /api/customers/:id
```

### Get Customer by Account Number
```
GET /api/customers/account/:accountNo
```

### Create Customer
```
POST /api/customers
```
**Body:**
```json
{
  "accountNo": "ACC001",
  "clientName": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "status": "active"
}
```

### Update Customer
```
PUT /api/customers/:id
```

### Delete Customer
```
DELETE /api/customers/:id
```

---

## 📄 Invoices API

### Get All Invoices
```
GET /api/invoices
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by invoiceNo, awbNo, or exporterRef
- `status` - Filter by status (draft, issued, paid, cancelled)
- `accountNo` - Filter by account number
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)

**Example:**
```
GET /api/invoices?page=1&limit=10&status=issued&startDate=2024-01-01
```

### Get Invoice Statistics
```
GET /api/invoices/stats
```
**Query Parameters:**
- `startDate` - Start date for statistics
- `endDate` - End date for statistics

### Get Invoice by ID
```
GET /api/invoices/:id
```

### Get Invoice by Invoice Number
```
GET /api/invoices/number/:invoiceNo
```

### Get Invoices by Customer
```
GET /api/invoices/customer/:customerId
GET /api/invoices/account/:accountNo
```

### Create Invoice
```
POST /api/invoices
```
**Body:** (Full invoice object with all fields)

### Update Invoice
```
PUT /api/invoices/:id
```

### Delete Invoice
```
DELETE /api/invoices/:id
```

---

## 📦 AWB/Tracking API

### Get All AWBs
```
GET /api/awb
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by awbNo, invoiceNo, or customer
- `status` - Filter by status (pending, in_transit, out_for_delivery, delivered, returned, cancelled)
- `accountNo` - Filter by account number
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)

### Get AWB Statistics
```
GET /api/awb/stats
```

### Track AWB (Public Endpoint)
```
GET /api/awb/track/:awbNo
```
**Response:**
```json
{
  "awbNo": "AWB123456",
  "status": "in_transit",
  "origin": "HYDERABAD",
  "destination": "MUMBAI",
  "bookingDate": "2024-01-15T00:00:00.000Z",
  "trackingHistory": [
    {
      "status": "in_transit",
      "location": "HYDERABAD",
      "description": "Package in transit",
      "timestamp": "2024-01-16T10:00:00.000Z"
    }
  ]
}
```

### Get AWB by ID
```
GET /api/awb/:id
```

### Get AWB by AWB Number
```
GET /api/awb/number/:awbNo
```

### Get AWBs by Customer
```
GET /api/awb/customer/:customerId
GET /api/awb/account/:accountNo
```

### Create AWB
```
POST /api/awb
```
**Body:** (Full AWB object with all fields)

### Update AWB
```
PUT /api/awb/:id
```

### Update Tracking Status
```
PUT /api/awb/:id/tracking
```
**Body:**
```json
{
  "status": "in_transit",
  "location": "HYDERABAD",
  "description": "Package picked up",
  "updatedBy": "admin"
}
```

### Delete AWB
```
DELETE /api/awb/:id
```

---

## 📊 Status Values

### Invoice Status
- `draft` - Invoice is being prepared
- `issued` - Invoice has been issued
- `paid` - Invoice has been paid
- `cancelled` - Invoice has been cancelled

### AWB Status
- `pending` - AWB created, awaiting pickup
- `in_transit` - Package is in transit
- `out_for_delivery` - Package is out for delivery
- `delivered` - Package has been delivered
- `returned` - Package has been returned
- `cancelled` - AWB has been cancelled

### Customer Status
- `active` - Customer is active
- `inactive` - Customer is inactive
- `suspended` - Customer account is suspended

---

## 🔒 Error Responses

All endpoints return standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

**Error Response Format:**
```json
{
  "message": "Error message here"
}
```

---

## 📝 Notes

- All dates should be in ISO 8601 format (YYYY-MM-DD or full ISO string)
- Pagination is available on list endpoints
- Search is case-insensitive
- All endpoints support JSON request/response
- CORS is enabled for frontend integration
