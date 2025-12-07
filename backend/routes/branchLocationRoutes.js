import express from 'express';
import {
  getAllBranchLocations,
  getBranchLocationById,
  createBranchLocation,
  updateBranchLocation,
  deleteBranchLocation
} from '../controllers/branchLocationController.js';

const router = express.Router();

// Get all branch locations
router.get('/', getAllBranchLocations);

// Get branch location by ID
router.get('/:id', getBranchLocationById);

// Create new branch location
router.post('/', createBranchLocation);

// Update branch location
router.put('/:id', updateBranchLocation);

// Delete branch location
router.delete('/:id', deleteBranchLocation);

export default router;

