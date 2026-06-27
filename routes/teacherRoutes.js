import express from 'express';
import {
  getTeachers,
  registerTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherProfile
} from '../controllers/teacherController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, getTeacherProfile);
router.get('/', protect, getTeachers);
router.post('/register', protect, registerTeacher);
router.put('/:id', protect, updateTeacher);
router.delete('/:id', protect, deleteTeacher);

export default router;
