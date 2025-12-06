import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  getCustomerByAccountNo,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';

const router = express.Router();

// Get all customers with pagination and search
router.get('/', getAllCustomers);

// Get customer by ID
router.get('/:id', getCustomerById);

// Get customer by account number
router.get('/account/:accountNo', getCustomerByAccountNo);

// Create new customer
router.post('/', createCustomer);

// Update customer
router.put('/:id', updateCustomer);

// Delete customer
router.delete('/:id', deleteCustomer);

export default router;
