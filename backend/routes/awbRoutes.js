import express from 'express';
import {
  getAllAWBs,
  getAWBById,
  getAWBByAWBNo,
  getAWBsByCustomer,
  createAWB,
  updateAWB,
  updateTrackingStatus,
  trackAWB,
  deleteAWB,
  getAWBStats
} from '../controllers/awbController.js';

const router = express.Router();

// Get all AWBs with filters
router.get('/', getAllAWBs);

// Get AWB statistics
router.get('/stats', getAWBStats);

// Public tracking endpoint (no auth required)
router.get('/track/:awbNo', trackAWB);

// Get AWB by ID
router.get('/:id', getAWBById);

// Get AWB by AWB number
router.get('/number/:awbNo', getAWBByAWBNo);

// Get AWBs by customer
router.get('/customer/:customerId', getAWBsByCustomer);
router.get('/account/:accountNo', getAWBsByCustomer);

// Create new AWB
router.post('/', createAWB);

// Update AWB
router.put('/:id', updateAWB);

// Update tracking status
router.put('/:id/tracking', updateTrackingStatus);

// Delete AWB
router.delete('/:id', deleteAWB);

export default router;
