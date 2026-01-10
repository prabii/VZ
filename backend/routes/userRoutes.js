import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
  changePassword
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/change-password', changePassword);

// Protected routes (should add admin middleware later)
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
