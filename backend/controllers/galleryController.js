import Gallery from '../models/Gallery.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/gallery');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Get all gallery items
export const getAllGalleryItems = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default to active items
    }
    
    const items = await Gallery.find(query)
      .populate('uploadedBy', 'username vendorName')
      .sort({ createdAt: -1 });
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single gallery item
export const getGalleryItemById = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'username vendorName');
    
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create gallery item (for URLs)
export const createGalleryItem = async (req, res) => {
  try {
    const { type, url, title, description, uploadedBy } = req.body;
    
    if (!type || !url) {
      return res.status(400).json({ message: 'Type and URL are required' });
    }
    
    const item = new Gallery({
      type,
      url: url.trim(),
      title: title?.trim() || '',
      description: description?.trim() || '',
      uploadedBy: uploadedBy || undefined,
      isActive: true
    });
    
    await item.save();
    
    res.status(201).json({
      message: 'Gallery item created successfully',
      item: await Gallery.findById(item._id).populate('uploadedBy', 'username vendorName')
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Upload gallery file (image or video)
export const uploadGalleryFile = async (req, res) => {
  try {
    const { type, title, description, uploadedBy, _id } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    
    // Determine file type if not provided
    const fileType = type || (req.file.mimetype.startsWith('image/') ? 'image' : 'video');
    
    // Construct URL - adjust based on your server setup
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/gallery/${req.file.filename}`;
    
    if (_id) {
      // Update existing item
      const item = await Gallery.findById(_id);
      if (!item) {
        return res.status(404).json({ message: 'Gallery item not found' });
      }
      
      // Delete old file if exists
      if (item.url && item.url.includes('/uploads/gallery/')) {
        const oldFilePath = path.join(uploadsDir, path.basename(item.url));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      item.type = fileType;
      item.url = fileUrl;
      if (title) item.title = title.trim();
      if (description) item.description = description.trim();
      
      await item.save();
      
      res.json({
        message: 'Gallery item updated successfully',
        item: await Gallery.findById(item._id).populate('uploadedBy', 'username vendorName')
      });
    } else {
      // Create new item
      const item = new Gallery({
        type: fileType,
        url: fileUrl,
        title: title?.trim() || '',
        description: description?.trim() || '',
        uploadedBy: uploadedBy || undefined,
        isActive: true
      });
      
      await item.save();
      
      res.status(201).json({
        message: 'Gallery item uploaded successfully',
        item: await Gallery.findById(item._id).populate('uploadedBy', 'username vendorName')
      });
    }
  } catch (error) {
    console.error('Error uploading gallery file:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update gallery item
export const updateGalleryItem = async (req, res) => {
  try {
    const { type, url, title, description, isActive } = req.body;
    
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    
    if (type) item.type = type;
    if (url) item.url = url.trim();
    if (title !== undefined) item.title = title.trim();
    if (description !== undefined) item.description = description.trim();
    if (isActive !== undefined) item.isActive = isActive;
    
    await item.save();
    
    res.json({
      message: 'Gallery item updated successfully',
      item: await Gallery.findById(item._id).populate('uploadedBy', 'username vendorName')
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete gallery item
export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    
    // Delete file if it's a local upload
    if (item.url && item.url.includes('/uploads/gallery/')) {
      const filePath = path.join(uploadsDir, path.basename(item.url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Gallery.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
