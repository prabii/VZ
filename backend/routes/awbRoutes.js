import express from 'express';
import {
  getAllAWBs,
  getAWBById,
  getAWBByAWBNo,
  getAWBsByCustomer,
  createAWB,
  updateAWB,
  updateBookingDate,
  updateBookingDateByAWBNo,
  updateTrackingStatus,
  updateTrackingStatusByAWBNo,
  trackAWB,
  deleteAWB,
  getAWBStats
} from '../controllers/awbController.js';

const router = express.Router();

// Log all PUT requests for debugging
router.use((req, res, next) => {
  if (req.method === 'PUT') {
    console.log('🔍 PUT request received:', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      url: req.url
    });
  }
  next();
});

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

// ========== PUT ROUTES - Must be in specific order ==========
// Update booking date/time by AWB number (MUST come before /:id routes)
// This route handles: PUT /api/awb/number/:awbNo/booking-date
router.put('/number/:awbNo/booking-date', updateBookingDateByAWBNo);

// Update tracking status by AWB number (must come before /:id routes)
router.put('/number/:awbNo/tracking', updateTrackingStatusByAWBNo);

// Update booking date/time by ID (must come before /:id route)
router.put('/:id/booking-date', updateBookingDate);

// Update tracking status (must come before /:id route)
router.put('/:id/tracking', updateTrackingStatus);

// Update AWB (general route - must come last)
router.put('/:id', updateAWB);

// Delete AWB
router.delete('/:id', deleteAWB);

export default router;
