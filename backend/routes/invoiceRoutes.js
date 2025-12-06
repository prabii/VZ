import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  getInvoiceByInvoiceNo,
  getInvoicesByCustomer,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats
} from '../controllers/invoiceController.js';

const router = express.Router();

// Get all invoices with filters
router.get('/', getAllInvoices);

// Get invoice statistics
router.get('/stats', getInvoiceStats);

// Get invoice by ID
router.get('/:id', getInvoiceById);

// Get invoice by invoice number
router.get('/number/:invoiceNo', getInvoiceByInvoiceNo);

// Get invoices by customer
router.get('/customer/:customerId', getInvoicesByCustomer);
router.get('/account/:accountNo', getInvoicesByCustomer);

// Create new invoice
router.post('/', createInvoice);

// Update invoice
router.put('/:id', updateInvoice);

// Delete invoice
router.delete('/:id', deleteInvoice);

export default router;
