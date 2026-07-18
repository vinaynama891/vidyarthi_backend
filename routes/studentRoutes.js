import express from 'express';
import {
  getStudents,
  registerStudent,
  updateStudent,
  deleteStudent,
  getStudentProfile,
  reportPayment
} from '../controllers/studentController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, getStudentProfile);
router.post('/report-payment', protect, reportPayment);
router.get('/', protect, getStudents);
router.post('/register', protect, registerStudent);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, deleteStudent);

export default router;
