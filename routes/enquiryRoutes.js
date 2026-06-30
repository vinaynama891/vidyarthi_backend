import express from 'express';
import protect from '../middleware/auth.js';
import {
  submitEnquiry,
  getEnquiries,
  deleteEnquiry,
  updateEnquiryNote
} from '../controllers/enquiryController.js';

const router = express.Router();

// Public route to submit enquiry
router.post('/', submitEnquiry);

// Protected routes (admin only)
router.get('/', protect, getEnquiries);
router.delete('/:id', protect, deleteEnquiry);
router.patch('/:id/note', protect, updateEnquiryNote);

export default router;
