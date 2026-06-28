import express from 'express';
import {
  getDemoClasses,
  createDemoClass,
  deleteDemoClass
} from '../controllers/demoClassController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getDemoClasses);

// Admin-only protected routes
router.post('/', protect, createDemoClass);
router.delete('/:id', protect, deleteDemoClass);

export default router;
