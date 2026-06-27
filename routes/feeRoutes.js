import express from 'express';
import {
  getFeeStructures,
  getFeeStructureByClass,
  updateFeeStructure,
  getStudentFeeRecords
} from '../controllers/feeController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/structure', getFeeStructures);
router.get('/structure/:class', protect, getFeeStructureByClass);
router.put('/structure/:class', protect, updateFeeStructure);
router.get('/records', protect, getStudentFeeRecords);

export default router;
