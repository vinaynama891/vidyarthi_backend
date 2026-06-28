import express from 'express';
import {
  getCoursePage,
  addBlock,
  deleteBlock
} from '../controllers/coursePageController.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/:courseName', getCoursePage);

// Admin protected routes
router.post('/:courseName/blocks', protect, upload.single('blockPhoto'), addBlock);
router.delete('/:courseName/blocks/:blockId', protect, deleteBlock);

export default router;
