import express from 'express';
import multer from 'multer';
import {
  getAllPriceSheets,
  getPriceSheetById,
  getActivePriceSheet,
  uploadPriceSheet,
  updatePriceSheet,
  deletePriceSheet,
  addPriceSheetItem,
  addBulkPriceSheetItems,
  updatePriceSheetItem,
  deletePriceSheetItem
} from '../controllers/priceSheetController.js';

const router = express.Router();

// Configure multer for file upload (memory storage for Excel files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

// Get all price sheets
router.get('/', getAllPriceSheets);

// Get active/default price sheet (for public frontend)
router.get('/active', getActivePriceSheet);

// Get price sheet by ID
router.get('/:id', getPriceSheetById);

// Upload price sheet (Excel file)
router.post('/upload', upload.single('file'), uploadPriceSheet);

// Update price sheet
router.put('/:id', updatePriceSheet);

// Add price sheet item
router.post('/:id/items', addPriceSheetItem);

// Add multiple price sheet items (bulk import)
router.post('/:id/items/bulk', addBulkPriceSheetItems);

// Update price sheet item
router.put('/:id/items/:itemId', updatePriceSheetItem);

// Delete price sheet item
router.delete('/:id/items/:itemId', deletePriceSheetItem);

// Delete price sheet
router.delete('/:id', deletePriceSheet);

export default router;
