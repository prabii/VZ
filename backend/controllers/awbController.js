import AWB from '../models/AWB.js';

// Get all AWBs
export const getAllAWBs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      accountNo = '',
      startDate = '',
      endDate = ''
    } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { awbNo: { $regex: search, $options: 'i' } },
        { invoiceNo: { $regex: search, $options: 'i' } },
        { customer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (accountNo) {
      query.accountNo = accountNo;
    }
    
    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }
    
    const awbs = await AWB.find(query)
      .populate('customerId', 'accountNo clientName')
      .sort({ bookingDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await AWB.countDocuments(query);
    
    res.json({
      awbs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single AWB
export const getAWBById = async (req, res) => {
  try {
    const awb = await AWB.findById(req.params.id)
      .populate('customerId', 'accountNo clientName email phone');
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    res.json(awb);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get AWB by AWB number (for tracking)
export const getAWBByAWBNo = async (req, res) => {
  try {
    const awb = await AWB.findOne({ awbNo: req.params.awbNo })
      .populate('customerId', 'accountNo clientName email phone');
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    res.json(awb);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get AWBs by customer
export const getAWBsByCustomer = async (req, res) => {
  try {
    const { customerId, accountNo } = req.params;
    const query = customerId ? { customerId } : { accountNo };
    
    const awbs = await AWB.find(query)
      .sort({ bookingDate: -1 })
      .limit(50);
    
    res.json(awbs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create AWB
export const createAWB = async (req, res) => {
  try {
    // Ensure status is valid - normalize to 'Pending Order' if invalid
    const validStatuses = ['Couriers', 'Courier Pickup', 'Shipped', 'Intransit', 'Arrived at Destination', 'Out for Delivery', 'Pending Order', 'Delivered'];
    let status = req.body.status || 'Pending Order';
    
    // If status is not in valid list, default to 'Pending Order'
    if (!validStatuses.includes(status)) {
      console.warn(`Invalid AWB status received: "${status}", defaulting to "Pending Order"`);
      status = 'Pending Order';
    }
    
    const awb = new AWB({
      ...req.body,
      status: status,
      trackingHistory: [{
        status: status,
        description: 'AWB created',
        timestamp: new Date()
      }]
    });
    const savedAWB = await awb.save();
    res.status(201).json(savedAWB);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'AWB number already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Update AWB
export const updateAWB = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle bookingDate update - parse and validate date/time
    if (updateData.bookingDate) {
      const bookingDate = new Date(updateData.bookingDate);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ message: 'Invalid booking date format' });
      }
      updateData.bookingDate = bookingDate;
    }
    
    updateData.updatedAt = Date.now();
    
    const awb = await AWB.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    res.json(awb);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update AWB tracking status
export const updateTrackingStatus = async (req, res) => {
  try {
    const { status, location, description, updatedBy, timestamp } = req.body;
    
    const awb = await AWB.findById(req.params.id);
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    
    // Use provided timestamp or default to current date/time
    const statusTimestamp = timestamp ? new Date(timestamp) : new Date();
    
    // Add to tracking history
    awb.trackingHistory.push({
      status: status || awb.status,
      location,
      description,
      updatedBy,
      timestamp: statusTimestamp
    });
    
    // Update status if provided
    if (status) {
      awb.status = status;
    }
    
    awb.updatedAt = Date.now();
    await awb.save();
    
    res.json(awb);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Track AWB by AWB number (public endpoint)
export const trackAWB = async (req, res) => {
  try {
    const awb = await AWB.findOne({ awbNo: req.params.awbNo })
      .select('awbNo status trackingHistory origin destination bookingDate shipper consignee');
    
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    
    res.json({
      awbNo: awb.awbNo,
      status: awb.status,
      origin: awb.origin,
      destination: awb.destination,
      bookingDate: awb.bookingDate,
      shipper: awb.shipper,
      consignee: awb.consignee,
      trackingHistory: awb.trackingHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking date/time by AWB ID
export const updateBookingDate = async (req, res) => {
  try {
    const { bookingDate } = req.body;
    
    if (!bookingDate) {
      return res.status(400).json({ message: 'Booking date is required' });
    }
    
    // Parse and validate the date
    const parsedDate = new Date(bookingDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid booking date format. Please use ISO 8601 format (e.g., 2024-12-25T14:30:00)' });
    }
    
    const awb = await AWB.findByIdAndUpdate(
      req.params.id,
      { 
        bookingDate: parsedDate,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    
    res.json({
      message: 'Booking date updated successfully',
      awb: awb
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update booking date/time by AWB number
export const updateBookingDateByAWBNo = async (req, res) => {
  try {
    const { bookingDate } = req.body;
    
    if (!bookingDate) {
      return res.status(400).json({ message: 'Booking date is required' });
    }
    
    // Parse and validate the date
    const parsedDate = new Date(bookingDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid booking date format. Please use ISO 8601 format (e.g., 2024-12-25T14:30:00)' });
    }
    
    const awb = await AWB.findOneAndUpdate(
      { awbNo: req.params.awbNo },
      { 
        bookingDate: parsedDate,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    
    res.json({
      message: 'Booking date updated successfully',
      awb: awb
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update tracking status by AWB number
export const updateTrackingStatusByAWBNo = async (req, res) => {
  try {
    const { status, location, description, updatedBy, timestamp } = req.body;
    
    console.log('Update tracking request:', {
      awbNo: req.params.awbNo,
      status,
      location,
      description,
      updatedBy,
      timestamp,
      timestampType: typeof timestamp
    });
    
    const awb = await AWB.findOne({ awbNo: req.params.awbNo });
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    
    // Use provided timestamp or default to current date/time
    let statusTimestamp;
    if (timestamp) {
      // Parse the timestamp - it should be an ISO string from frontend
      statusTimestamp = new Date(timestamp);
      // Validate the date
      if (isNaN(statusTimestamp.getTime())) {
        console.warn('Invalid timestamp provided, using current time:', timestamp);
        // Invalid date, use current time
        statusTimestamp = new Date();
      } else {
        console.log('Using provided timestamp:', statusTimestamp.toISOString());
      }
    } else {
      console.log('No timestamp provided, using current time');
      statusTimestamp = new Date();
    }
    
    // Add to tracking history
    const trackingEntry = {
      status: status || awb.status,
      location,
      description,
      updatedBy,
      timestamp: statusTimestamp
    };
    
    console.log('Adding tracking entry:', trackingEntry);
    
    awb.trackingHistory.push(trackingEntry);
    
    // Update status if provided
    if (status) {
      awb.status = status;
    }
    
    awb.updatedAt = Date.now();
    await awb.save();
    
    // Return the updated AWB with the new tracking entry
    const updatedAWB = await AWB.findOne({ awbNo: req.params.awbNo });
    const latestEntry = updatedAWB.trackingHistory[updatedAWB.trackingHistory.length - 1];
    console.log('Tracking updated successfully. Latest entry timestamp:', latestEntry.timestamp);
    console.log('Latest entry:', JSON.stringify(latestEntry, null, 2));
    
    res.json(updatedAWB);
  } catch (error) {
    console.error('Error updating tracking status:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete AWB
export const deleteAWB = async (req, res) => {
  try {
    const awb = await AWB.findByIdAndDelete(req.params.id);
    if (!awb) {
      return res.status(404).json({ message: 'AWB not found' });
    }
    res.json({ message: 'AWB deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get AWB statistics
export const getAWBStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }
    
    const stats = await AWB.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAWBs: { $sum: 1 },
          byStatus: {
            $push: '$status'
          }
        }
      }
    ]);
    
    const statusCounts = await AWB.aggregate([
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
