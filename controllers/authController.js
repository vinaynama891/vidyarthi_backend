import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import jwt from 'jsonwebtoken';

// Generate Token with Role
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecretjwtkeyvidyarthi2024', {
    expiresIn: '30d'
  });
};

// @desc    Auth user & get token (Unified Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { emailOrId, password } = req.body;

  if (!emailOrId || !password) {
    return res.status(400).json({ message: 'Please enter Email/ID and Password' });
  }

  try {
    // 1. Check Admin (by email)
    const admin = await Admin.findOne({ email: emailOrId.toLowerCase() });
    if (admin && (await admin.matchPassword(password))) {
      return res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        token: generateToken(admin._id, 'admin')
      });
    }

    // 2. Check Teacher (by email or teacherId)
    const teacher = await Teacher.findOne({
      $or: [
        { email: emailOrId.toLowerCase() },
        { teacherId: emailOrId.toUpperCase() }
      ]
    });
    if (teacher && (await teacher.matchPassword(password))) {
      return res.json({
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        teacherId: teacher.teacherId,
        role: 'teacher',
        token: generateToken(teacher._id, 'teacher')
      });
    }

    // 3. Check Student (by studentId or phone)
    const student = await Student.findOne({
      $or: [
        { studentId: emailOrId.toUpperCase() },
        { phone: emailOrId }
      ]
    });
    if (student && (await student.matchPassword(password))) {
      return res.json({
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        role: 'student',
        studentType: student.studentType || 'Regular',
        token: generateToken(student._id, 'student')
      });
    }

    res.status(401).json({ message: 'Invalid credentials. Check Email/ID and Password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  try {
    const user = req.user;

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

