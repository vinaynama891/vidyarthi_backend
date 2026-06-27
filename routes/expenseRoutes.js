import express from 'express';
import {
  getExpenses,
  addExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getExpenses);
router.post('/', protect, addExpense);
router.delete('/:id', protect, deleteExpense);

export default router;
