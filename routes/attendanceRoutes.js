import express from 'express';
import protect from '../middleware/auth.js';
import {
  markAttendance,
  getAttendance,
  getStudentAttendanceHistory,
  getTeacherAttendanceHistory
} from '../controllers/attendanceController.js';

const router = express.Router();

// All routes are protected by auth middleware
router.use(protect);

router.post('/mark', markAttendance);
router.get('/', getAttendance);
router.get('/student-history', getStudentAttendanceHistory);
router.get('/teacher-history', getTeacherAttendanceHistory);

export default router;
