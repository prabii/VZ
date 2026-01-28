import PriceSheet from '../models/PriceSheet.js';
import XLSX from 'xlsx';

// Get all price sheets
export const getAllPriceSheets = async (req, res) => {
  try {
    const { isActive, isDefault, vendorId } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (isDefault !== undefined) {
      query.isDefault = isDefault === 'true';
    }
    
    // If vendorId is provided, only return price sheets assigned to that vendor
    // or price sheets with no assigned vendors (available to all)
    if (vendorId) {
      const mongoose = (await import('mongoose')).default;
      // Convert vendorId to ObjectId for proper comparison
      let vendorObjectId;
      try {
        vendorObjectId = mongoose.Types.ObjectId.isValid(vendorId) 
          ? new mongoose.Types.ObjectId(vendorId) 
          : vendorId;
      } catch (e) {
        vendorObjectId = vendorId;
      }
      
      query.$or = [
        { assignedVendors: { $in: [vendorObjectId] } }, // Vendor is in the assigned vendors array
        { assignedVendors: { $size: 0 } }, // Empty array means available to all vendors
        { assignedVendors: { $exists: false } }, // Field doesn't exist (old documents before assignment feature)
        { assignedVendors: null } // Field is null
      ];
      
      console.log('Filtering price sheets for vendor:', vendorId, 'Query:', JSON.stringify(query));
    }
    
    const priceSheets = await PriceSheet.find(query)
      .populate('uploadedBy', 'username vendorName')
      .populate('assignedVendors', 'username vendorName')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${priceSheets.length} price sheets for vendor ${vendorId || 'all'}`);
    
    res.json(priceSheets);
  } catch (error) {
    console.error('Error getting price sheets:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single price sheet
export const getPriceSheetById = async (req, res) => {
  try {
    const priceSheet = await PriceSheet.findById(req.params.id)
      .populate('uploadedBy', 'username vendorName');
    
    if (!priceSheet) {
      return res.status(404).json({ message: 'Price sheet not found' });
    }
    
    res.json(priceSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get default/active price sheet
export const getActivePriceSheet = async (req, res) => {
  try {
    const { vendorId } = req.query;
    const query = { isActive: true };
    
    // If vendorId is provided, filter by assigned vendors
    if (vendorId) {
      const mongoose = (await import('mongoose')).default;
      // Convert vendorId to ObjectId for proper comparison
      let vendorObjectId;
      try {
        vendorObjectId = mongoose.Types.ObjectId.isValid(vendorId) 
          ? new mongoose.Types.ObjectId(vendorId) 
          : vendorId;
      } catch (e) {
        vendorObjectId = vendorId;
      }
      
      query.$or = [
        { assignedVendors: { $in: [vendorObjectId] } }, // Vendor is in the assigned vendors array
        { assignedVendors: { $size: 0 } }, // Empty array means available to all vendors
        { assignedVendors: { $exists: false } }, // Field doesn't exist (old documents before assignment feature)
        { assignedVendors: null } // Field is null
      ];
      
      console.log('Getting active price sheet for vendor:', vendorId);
    }
    
    let priceSheet = await PriceSheet.findOne({ ...query, isDefault: true })
      .populate('assignedVendors', 'username vendorName');
    
    // If no default, get the most recent active sheet
    if (!priceSheet) {
      priceSheet = await PriceSheet.findOne(query)
        .populate('assignedVendors', 'username vendorName')
        .sort({ createdAt: -1 });
    }
    
    if (!priceSheet) {
      return res.status(404).json({ message: 'No active price sheet found' });
    }
    
    console.log('Found active price sheet:', priceSheet.sheetName, 'Assigned vendors:', priceSheet.assignedVendors?.map(v => v._id || v));
    
    res.json(priceSheet);
  } catch (error) {
    console.error('Error getting active price sheet:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create empty price sheet
export const createPriceSheet = async (req, res) => {
  try {
    const { sheetName, description, isDefault, uploadedBy, assignedVendors } = req.body;
    
    if (!sheetName || !sheetName.trim()) {
      return res.status(400).json({ message: 'Sheet name is required' });
    }
    
    // If setting as default, unset other defaults
    if (isDefault === true || isDefault === 'true') {
      await PriceSheet.updateMany({}, { isDefault: false });
    }
    
    // Validate uploadedBy - must be a valid MongoDB ObjectId or undefined
    let validUploadedBy = undefined;
    if (uploadedBy) {
      // Check if it's a valid ObjectId format (24 hex characters)
      const mongoose = (await import('mongoose')).default;
      if (mongoose.Types.ObjectId.isValid(uploadedBy)) {
        validUploadedBy = uploadedBy;
      } else {
        console.warn(`Invalid uploadedBy value provided: ${uploadedBy}, ignoring it`);
        // Set to undefined if invalid
        validUploadedBy = undefined;
      }
    }
    
    // Validate assignedVendors - must be an array of valid ObjectIds
    const mongoose = (await import('mongoose')).default;
    let validAssignedVendors = [];
    if (assignedVendors && Array.isArray(assignedVendors)) {
      validAssignedVendors = assignedVendors.filter(vendorId => 
        mongoose.Types.ObjectId.isValid(vendorId)
      );
    }
    
    // Create price sheet with empty items
    const priceSheet = new PriceSheet({
      sheetName: sheetName.trim(),
      description: description || '',
      items: [],
      uploadedBy: validUploadedBy,
      assignedVendors: validAssignedVendors,
      isActive: true,
      isDefault: isDefault === true || isDefault === 'true'
    });
    
    await priceSheet.save();
    
    res.status(201).json({
      message: 'Price sheet created successfully',
      priceSheet: await PriceSheet.findById(priceSheet._id)
        .populate('uploadedBy', 'username vendorName')
        .populate('assignedVendors', 'username vendorName')
    });
  } catch (error) {
    console.error('Error creating price sheet:', error);
    res.status(400).json({ message: error.message });
  }
};

// Upload and parse Excel file
export const uploadPriceSheet = async (req, res) => {
  try {
    const { sheetName, description, isDefault, uploadedBy } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required' });
    }
    
    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName_excel = workbook.SheetNames[0]; // Get first sheet
    const worksheet = workbook.Sheets[sheetName_excel];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: ''
    });
    
    // Parse data - assuming first row is headers
    const headers = data[0] || [];
    const items = [];
    
    // Find column indices
    const itemNameIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('item') || 
           h.toString().toLowerCase().includes('product') ||
           h.toString().toLowerCase().includes('description'))
    );
    const hsnIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('hsn')
    );
    const weightIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('weight') ||
           h.toString().toLowerCase().includes('kg'))
    );
    const rateIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('rate') ||
           h.toString().toLowerCase().includes('price') ||
           h.toString().toLowerCase().includes('amount'))
    );
    const destinationIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('destination')
    );
    const countryIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('country') ||
           h.toString().toLowerCase().includes('nation'))
    );
    const serviceIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('service')
    );
    
    // Process rows (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const itemName = itemNameIndex >= 0 ? (row[itemNameIndex] || '').toString().trim() : '';
      const hsnCode = hsnIndex >= 0 ? (row[hsnIndex] || '').toString().trim() : '';
      const weight = weightIndex >= 0 ? (row[weightIndex] || '').toString().trim() : '';
      const rateStr = rateIndex >= 0 ? (row[rateIndex] || '').toString().trim() : '';
      const destination = destinationIndex >= 0 ? (row[destinationIndex] || '').toString().trim() : '';
      const country = countryIndex >= 0 ? (row[countryIndex] || '').toString().trim() : '';
      const serviceType = serviceIndex >= 0 ? (row[serviceIndex] || '').toString().trim() : '';
      
      // Parse rate (remove currency symbols, commas, etc.)
      const rate = parseFloat(rateStr.toString().replace(/[₹,$,\s,]/g, '')) || 0;
      
      // Only add if we have at least item name and rate
      if (itemName && rate > 0) {
        items.push({
          itemName,
          hsnCode,
          weight,
          rate,
          destination,
          country,
          countryCode: '', // Can be extracted from country name if needed
          serviceType,
          currency: 'INR'
        });
      }
    }
    
    if (items.length === 0) {
      return res.status(400).json({ message: 'No valid price items found in the Excel file' });
    }
    
    // If setting as default, unset other defaults
    if (isDefault === true || isDefault === 'true') {
      await PriceSheet.updateMany({}, { isDefault: false });
    }
    
    // Create price sheet
    const priceSheet = new PriceSheet({
      sheetName: sheetName || `Price Sheet ${new Date().toLocaleDateString()}`,
      description: description || '',
      items,
      originalFileName: req.file.originalname,
      uploadedBy: uploadedBy || undefined,
      isActive: true,
      isDefault: isDefault === true || isDefault === 'true'
    });
    
    await priceSheet.save();
    
    res.status(201).json({
      message: 'Price sheet uploaded successfully',
      priceSheet: await PriceSheet.findById(priceSheet._id).populate('uploadedBy', 'username vendorName')
    });
  } catch (error) {
    console.error('Error uploading price sheet:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update price sheet
export const updatePriceSheet = async (req, res) => {
  try {
    const { sheetName, description, isActive, isDefault, items, assignedVendors } = req.body;
    
    const updateData = {};
    if (sheetName !== undefined) updateData.sheetName = sheetName;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;
      // If setting as default, unset other defaults
      if (isDefault === true || isDefault === 'true') {
        await PriceSheet.updateMany(
          { _id: { $ne: req.params.id } },
          { isDefault: false }
        );
      }
    }
    if (items !== undefined) updateData.items = items;
    
    // Validate and update assignedVendors
    if (assignedVendors !== undefined) {
      const mongoose = (await import('mongoose')).default;
      if (Array.isArray(assignedVendors)) {
        updateData.assignedVendors = assignedVendors.filter(vendorId => 
          mongoose.Types.ObjectId.isValid(vendorId)
        );
      } else {
        updateData.assignedVendors = [];
      }
    }
    
    updateData.updatedAt = Date.now();
    
    const priceSheet = await PriceSheet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('uploadedBy', 'username vendorName')
      .populate('assignedVendors', 'username vendorName');
    
    if (!priceSheet) {
      return res.status(404).json({ message: 'Price sheet not found' });
    }
    
    res.json({
      message: 'Price sheet updated successfully',
      priceSheet
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete price sheet
export const deletePriceSheet = async (req, res) => {
  try {
    const priceSheet = await PriceSheet.findByIdAndDelete(req.params.id);
    
    if (!priceSheet) {
      return res.status(404).json({ message: 'Price sheet not found' });
    }
    
    res.json({ message: 'Price sheet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update price sheet item
export const updatePriceSheetItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { itemName, hsnCode, weight, rate, destination, country, countryCode, serviceType, currency } = req.body;
    
    if (!id || !itemId) {
      return res.status(400).json({ message: 'Price sheet ID and item ID are required' });
    }
    
    const priceSheet = await PriceSheet.findById(id);
    if (!priceSheet) {
      return res.status(404).json({ message: 'Price sheet not found' });
    }
    
    const item = priceSheet.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Update fields - explicitly set even if empty string to allow clearing fields
    if (itemName !== undefined) item.itemName = itemName;
    if (hsnCode !== undefined) item.hsnCode = hsnCode || '';
    if (weight !== undefined) item.weight = weight || '';
    if (rate !== undefined) item.rate = parseFloat(rate) || 0;
    if (destination !== undefined) item.destination = destination || '';
    // Country update - explicitly set the value (even if empty string)
    if (country !== undefined) {
      item.country = country || '';
    }
    if (countryCode !== undefined) {
      item.countryCode = countryCode || '';
    }
    if (serviceType !== undefined) item.serviceType = serviceType || '';
    if (currency !== undefined) item.currency = currency || 'INR';
    
    priceSheet.updatedAt = Date.now();
    await priceSheet.save();
    
    // Return the updated item
    const updatedItem = priceSheet.items.id(itemId);
    res.json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating price sheet item:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to update item',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete price sheet item
export const deletePriceSheetItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    console.log('Delete item request:', { id, itemId, params: req.params });
    
    if (!id || !itemId) {
      return res.status(400).json({ message: 'Price sheet ID and item ID are required' });
    }
    
    const priceSheet = await PriceSheet.findById(id);
    if (!priceSheet) {
      return res.status(404).json({ message: 'Price sheet not found' });
    }
    
    // Find the item index in the array
    const itemIndex = priceSheet.items.findIndex(item => {
      const itemIdStr = item._id ? item._id.toString() : '';
      return itemIdStr === itemId;
    });
    
    if (itemIndex === -1) {
      console.log('Available items:', priceSheet.items.map(i => ({ _id: i._id?.toString(), itemName: i.itemName })));
      return res.status(404).json({ 
        message: 'Item not found in price sheet',
        itemId: itemId,
        availableItems: priceSheet.items.length
      });
    }
    
    // Remove the item from the array using splice
    priceSheet.items.splice(itemIndex, 1);
    priceSheet.updatedAt = Date.now();
    await priceSheet.save();
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting price sheet item:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to delete item',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Add price sheet item manually
export const addPriceSheetItem = async (req, res) => {
  try {
    const { itemName, hsnCode, weight, rate, destination, country, countryCode, serviceType, currency } = req.body;
    
    if (!itemName || !rate) {
      return res.status(400).json({ message: 'Item name and rate are required' });
    }
    
    const priceSheet = await PriceSheet.findById(req.params.id);
    if (!priceSheet) {
      return res.status(404).json({ message: 'Price sheet not found' });
    }
    
    const newItem = {
      itemName,
      hsnCode: hsnCode || '',
      weight: weight || '',
      rate: parseFloat(rate) || 0,
      destination: destination || '',
      country: country || '',
      countryCode: countryCode || '',
      serviceType: serviceType || '',
      currency: currency || 'INR'
    };
    
    priceSheet.items.push(newItem);
    priceSheet.updatedAt = Date.now();
    await priceSheet.save();
    
    res.json({
      message: 'Item added successfully',
      item: priceSheet.items[priceSheet.items.length - 1]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add multiple price sheet items (bulk import)
export const addBulkPriceSheetItems = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }
    
    const priceSheet = await PriceSheet.findById(req.params.id);
    if (!priceSheet) {
      return res.status(404).json({ message: 'Price sheet not found' });
    }
    
    const validItems = [];
    const errors = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { itemName, hsnCode, weight, rate, destination, country, countryCode, serviceType, currency } = item;
      
      if (!itemName || !rate) {
        errors.push(`Row ${i + 1}: Item name and rate are required`);
        continue;
      }
      
      const parsedRate = parseFloat(rate);
      if (isNaN(parsedRate) || parsedRate <= 0) {
        errors.push(`Row ${i + 1}: Invalid rate value`);
        continue;
      }
      
      validItems.push({
        itemName: itemName.toString().trim(),
        hsnCode: (hsnCode || '').toString().trim(),
        weight: (weight || '').toString().trim(),
        rate: parsedRate,
        destination: (destination || '').toString().trim(),
        country: (country || '').toString().trim(),
        countryCode: (countryCode || '').toString().trim(),
        serviceType: (serviceType || '').toString().trim(),
        currency: (currency || 'INR').toString().trim()
      });
    }
    
    if (validItems.length === 0) {
      return res.status(400).json({ 
        message: 'No valid items to add',
        errors 
      });
    }
    
    priceSheet.items.push(...validItems);
    priceSheet.updatedAt = Date.now();
    await priceSheet.save();
    
    res.json({
      message: `Successfully added ${validItems.length} item(s)`,
      addedCount: validItems.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
