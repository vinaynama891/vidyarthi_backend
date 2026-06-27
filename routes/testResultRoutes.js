import express from 'express';
import {
  getTestResults,
  publishTestResult,
  createTestResult
} from '../controllers/testResultController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getTestResults);
router.put('/:id/publish', protect, publishTestResult);
router.post('/', protect, createTestResult);

export default router;
