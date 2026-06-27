import express from 'express';
import {
  getStudents,
  registerStudent,
  updateStudent,
  deleteStudent,
  getStudentProfile
} from '../controllers/studentController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, getStudentProfile);
router.get('/', protect, getStudents);
router.post('/register', protect, registerStudent);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, deleteStudent);

export default router;
