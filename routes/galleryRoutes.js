import express from 'express';
import {
  getGallery,
  uploadPhotos,
  deletePhoto
} from '../controllers/galleryController.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getGallery);
router.post('/upload', protect, upload.array('photos', 10), uploadPhotos);
router.delete('/:id', protect, deletePhoto);

export default router;
