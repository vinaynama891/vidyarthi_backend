import Attendance from '../models/Attendance.js';

/**
 * Save or update daily attendance logs for students or teachers (bulk upsert)
 * Route: POST /api/attendance/mark
 * Access: Admin
 */
export const markAttendance = async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden. Admin or Teacher role required.' });
    }

    const { date, userType, records } = req.body;

    if (req.userRole === 'teacher' && userType !== 'student') {
      return res.status(403).json({ message: 'Forbidden. Teachers can only mark student attendance.' });
    }

    if (!date || !userType || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid payload. Date, userType and records array are required.' });
    }

    // Map records to bulkWrite operations
    const operations = records.map((rec) => {
      const filter = { date, userType };
      if (userType === 'student') {
        filter.studentId = rec.studentId;
      } else {
        filter.teacherId = rec.teacherId;
      }

      return {
        updateOne: {
          filter,
          update: { ...filter, status: rec.status },
          upsert: true
        }
      };
    });

    await Attendance.bulkWrite(operations);

    res.status(200).json({ message: 'Attendance register updated successfully.' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: `Failed to mark attendance: ${error.message}` });
  }
};

/**
 * Fetch attendance logs for a date and userType
 * Route: GET /api/attendance
 * Access: Admin, Teacher
 */
export const getAttendance = async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden. Admin or Teacher role required.' });
    }

    const { date, userType } = req.query;

    if (req.userRole === 'teacher' && userType !== 'student') {
      return res.status(403).json({ message: 'Forbidden. Teachers can only fetch student attendance.' });
    }

    if (!date || !userType) {
      return res.status(400).json({ message: 'Date and userType are required parameters.' });
    }

    const logs = await Attendance.find({ date, userType });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: `Failed to fetch attendance logs: ${error.message}` });
  }
};

/**
 * Fetch log history of the logged in student
 * Route: GET /api/attendance/student-history
 * Access: Student
 */
export const getStudentAttendanceHistory = async (req, res) => {
  try {
    if (req.userRole !== 'student') {
      return res.status(403).json({ message: 'Forbidden. Student role required.' });
    }

    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID not found in profile.' });
    }

    const history = await Attendance.find({ studentId, userType: 'student' }).select('date status -_id');
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    res.status(500).json({ message: `Failed to fetch attendance history: ${error.message}` });
  }
};

/**
 * Fetch log history of the logged in teacher
 * Route: GET /api/attendance/teacher-history
 * Access: Teacher
 */
export const getTeacherAttendanceHistory = async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden. Teacher role required.' });
    }

    const teacherId = req.user._id;
    const history = await Attendance.find({ teacherId, userType: 'teacher' }).select('date status -_id');
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching teacher attendance history:', error);
    res.status(500).json({ message: `Failed to fetch attendance history: ${error.message}` });
  }
};
