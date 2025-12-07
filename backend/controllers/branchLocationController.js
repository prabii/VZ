import BranchLocation from '../models/BranchLocation.js';

// Get all branch locations
export const getAllBranchLocations = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const branches = await BranchLocation.find(query)
      .sort({ createdAt: -1 });
    
    res.json({
      branches,
      total: branches.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single branch location
export const getBranchLocationById = async (req, res) => {
  try {
    const branch = await BranchLocation.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch location not found' });
    }
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create branch location
export const createBranchLocation = async (req, res) => {
  try {
    const { address, mobileNumber, email, contactPerson, city, state, pincode } = req.body;
    
    // Validate required fields
    if (!address || !mobileNumber || !email || !contactPerson) {
      return res.status(400).json({ 
        message: 'Address, mobile number, email, and contact person are required' 
      });
    }
    
    const branch = new BranchLocation({
      address,
      mobileNumber,
      email,
      contactPerson,
      city,
      state,
      pincode
    });
    
    const savedBranch = await branch.save();
    res.status(201).json(savedBranch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update branch location
export const updateBranchLocation = async (req, res) => {
  try {
    const branch = await BranchLocation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch location not found' });
    }
    
    res.json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete branch location
export const deleteBranchLocation = async (req, res) => {
  try {
    const branch = await BranchLocation.findByIdAndDelete(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch location not found' });
    }
    
    res.json({ 
      message: 'Branch location deleted successfully',
      deletedBranch: branch
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

