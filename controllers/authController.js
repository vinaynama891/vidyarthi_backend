import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import jwt from 'jsonwebtoken';
import { sendWhatsAppMessage } from '../config/whatsapp.js';

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
// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  try {
    let user;
    if (req.userRole === 'admin') {
      user = await Admin.findById(req.user._id);
    } else if (req.userRole === 'teacher') {
      user = await Teacher.findById(req.user._id);
    } else if (req.userRole === 'student') {
      user = await Student.findById(req.user._id);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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

// @desc    Request Student OTP for password change
// @route   POST /api/auth/student/request-change
// @access  Private (Student)
export const requestStudentPasswordChange = async (req, res) => {
  const { currentPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ message: 'Current password is required' });
  }

  try {
    // 1. Ensure user is a student
    if (req.userRole !== 'student') {
      return res.status(403).json({ message: 'Access denied. Only students can perform this action.' });
    }

    // 2. Fetch student
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 3. Verify old password
    const isMatch = await student.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // 4. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    student.tempOtp = otp;
    student.tempOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await student.save();

    // 5. Send OTP via WhatsApp
    const messageBody = `Your OTP for changing password at Vidyarthi Classes is: *${otp}*.\nIt is valid for 10 minutes. Please do not share this OTP with anyone.`;
    
    const whatsappResult = await sendWhatsAppMessage({
      to: student.phone,
      body: messageBody
    });

    // Mask phone number for security
    const maskedPhone = student.phone.length > 4 
      ? `******${student.phone.slice(-4)}` 
      : student.phone;

    if (!whatsappResult.success) {
      console.warn(`WhatsApp send failed: ${whatsappResult.error}. Current OTP is ${otp}`);
      
      // In development mode, return success with devOtp so user can test even if WhatsApp API fails/is stopped
      if (process.env.NODE_ENV !== 'production') {
        return res.status(200).json({
          success: true,
          message: `[DEV ONLY] WhatsApp message failed (${whatsappResult.error}). Use OTP: ${otp}`,
          maskedPhone,
          devOtp: otp
        });
      }

      return res.status(500).json({
        message: `Failed to send OTP via WhatsApp: ${whatsappResult.error}`
      });
    }

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to registered mobile number: ${maskedPhone}`,
      maskedPhone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Student OTP and change password
// @route   POST /api/auth/student/verify-change
// @access  Private (Student)
export const verifyStudentOtpAndChangePassword = async (req, res) => {
  const { otp, newPassword } = req.body;

  if (!otp || !newPassword) {
    return res.status(400).json({ message: 'OTP and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // 1. Ensure user is a student
    if (req.userRole !== 'student') {
      return res.status(403).json({ message: 'Access denied. Only students can perform this action.' });
    }

    // 2. Fetch student
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 3. Verify OTP exists and is valid
    if (!student.tempOtp || !student.tempOtpExpires) {
      return res.status(400).json({ message: 'No pending OTP verification request found' });
    }

    if (student.tempOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > student.tempOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // 4. Update password
    student.password = newPassword;
    
    // Clear OTP fields
    student.tempOtp = undefined;
    student.tempOtpExpires = undefined;
    
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

