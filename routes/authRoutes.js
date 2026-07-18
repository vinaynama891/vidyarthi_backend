import express from 'express';
import {
  loginUser,
  changePassword,
  requestStudentPasswordChange,
  verifyStudentOtpAndChangePassword
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);
router.post('/student/request-change', protect, requestStudentPasswordChange);
router.post('/student/verify-change', protect, verifyStudentOtpAndChangePassword);

export default router;
