import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BranchLocation from '../models/BranchLocation.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedBranchLocations = async () => {
  try {
    await connectDB();
    
    // Check if default branch already exists
    const existingBranch = await BranchLocation.findOne({
      email: 'momai.international1@gmail.com'
    });
    
    if (existingBranch) {
      console.log('Default branch location already exists');
      process.exit(0);
    }
    
    // Create default branch location
    const defaultBranch = new BranchLocation({
      address: 'PLOT NO 40, SARDAR PATEL SOCIETY 2, SARU SECTION ROAD, JAMNAGAR, GUJARAT',
      mobileNumber: '9537314061',
      email: 'momai.international1@gmail.com',
      contactPerson: 'HITESH MANILAL VADHER',
      city: 'Jamnagar',
      state: 'Gujarat',
      pincode: '361001',
      isActive: true
    });
    
    await defaultBranch.save();
    console.log('✅ Default branch location seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding branch locations:', error);
    process.exit(1);
  }
};

seedBranchLocations();

