import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

// @desc    Get dashboard stats (Total Students, Teachers, and Fee Aggregates)
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({});
    const totalTeachers = await Teacher.countDocuments({});

    const allStudents = await Student.find({});

    let totalFees = 0;
    let paidFees = 0;
    let pendingFees = 0;

    allStudents.forEach((student) => {
      const netFee = student.totalFees - student.discount;
      totalFees += netFee;
      paidFees += student.paidFees;
      
      const pending = netFee - student.paidFees;
      if (pending > 0) {
        pendingFees += pending;
      }
    });

    res.json({
      totalStudents,
      totalTeachers,
      totalFees,
      paidFees,
      pendingFees
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
