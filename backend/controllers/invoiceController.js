import Invoice from '../models/Invoice.js';

// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      accountNo = '',
      startDate = '',
      endDate = '',
      vendorId = '',
      userRole = ''
    } = req.query;
    
    const query = {};
    
    // If vendor user, only show their invoices. Admin can see all
    if (vendorId && userRole === 'vendor') {
      query.vendorId = vendorId;
    }
    // If no vendorId but userRole is vendor, don't show any (shouldn't happen, but safety check)
    else if (userRole === 'vendor' && !vendorId) {
      return res.json({
        invoices: [],
        totalPages: 0,
        currentPage: page,
        total: 0
      });
    }
    
    if (search) {
      query.$or = [
        { invoiceNo: { $regex: search, $options: 'i' } },
        { awbNo: { $regex: search, $options: 'i' } },
        { exporterRef: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (accountNo) {
      query.accountNo = accountNo;
    }
    
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    
    const invoices = await Invoice.find(query)
      .populate('customerId', 'accountNo clientName')
      .sort({ invoiceDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Invoice.countDocuments(query);
    
    res.json({
      invoices,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single invoice
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'accountNo clientName email phone');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoice by invoice number
export const getInvoiceByInvoiceNo = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNo: req.params.invoiceNo })
      .populate('customerId', 'accountNo clientName email phone');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoices by customer
export const getInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId, accountNo } = req.params;
    const query = customerId ? { customerId } : { accountNo };
    
    const invoices = await Invoice.find(query)
      .sort({ invoiceDate: -1 })
      .limit(50);
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create invoice
export const createInvoice = async (req, res) => {
  try {
    // Get vendorId from request body or query (set by frontend based on logged-in user)
    const vendorId = req.body.vendorId || req.query.vendorId;
    
    const invoice = new Invoice({
      ...req.body,
      vendorId: vendorId || undefined // Set vendorId if provided
    });
    const savedInvoice = await invoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Invoice number already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    
    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgAmount: { $avg: '$totalAmount' },
          byStatus: {
            $push: '$status'
          }
        }
      }
    ]);
    
    const statusCounts = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      ...stats[0],
      statusBreakdown: statusCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
