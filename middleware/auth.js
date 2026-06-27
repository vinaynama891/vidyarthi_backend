import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyvidyarthi2024');

      // Fetch user based on token role
      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
        req.userRole = 'admin';
      } else if (decoded.role === 'teacher') {
        req.user = await Teacher.findById(decoded.id).select('-password');
        req.userRole = 'teacher';
      } else if (decoded.role === 'student') {
        req.user = await Student.findById(decoded.id).select('-password');
        req.userRole = 'student';
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user profile not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export default protect;
