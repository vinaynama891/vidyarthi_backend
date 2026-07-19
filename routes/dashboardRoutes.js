import express from 'express';
import { getDashboardStats, getRevenueStats } from '../controllers/dashboardController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/revenue', protect, getRevenueStats);

export default router;
