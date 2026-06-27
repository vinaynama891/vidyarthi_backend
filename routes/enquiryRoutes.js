import express from 'express';
import protect from '../middleware/auth.js';
import {
  submitEnquiry,
  getEnquiries,
  deleteEnquiry
} from '../controllers/enquiryController.js';

const router = express.Router();

// Public route to submit enquiry
router.post('/', submitEnquiry);

// Protected routes (admin only)
router.get('/', protect, getEnquiries);
router.delete('/:id', protect, deleteEnquiry);

export default router;
