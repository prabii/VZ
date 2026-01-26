import express from 'express';
import {
  getAllGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  uploadGalleryFile,
  updateGalleryItem,
  deleteGalleryItem,
  upload
} from '../controllers/galleryController.js';

const router = express.Router();

// Get all gallery items
router.get('/', getAllGalleryItems);

// Get gallery item by ID
router.get('/:id', getGalleryItemById);

// Create gallery item (for URLs)
router.post('/', createGalleryItem);

// Upload gallery file (image or video)
router.post('/upload', upload.single('file'), uploadGalleryFile);

// Update gallery item
router.put('/:id', updateGalleryItem);

// Delete gallery item
router.delete('/:id', deleteGalleryItem);

export default router;
