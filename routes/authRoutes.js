import express from 'express';
import { loginUser, changePassword } from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);

export default router;
