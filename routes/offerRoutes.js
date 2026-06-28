import express from 'express';
import {
  getOffers,
  createOffer,
  toggleOffer,
  deleteOffer
} from '../controllers/offerController.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public route to get offers
router.get('/', getOffers);

// Admin protected routes
router.post('/', protect, upload.single('offerPhoto'), createOffer);
router.put('/:id/toggle', protect, toggleOffer);
router.delete('/:id', protect, deleteOffer);

export default router;
