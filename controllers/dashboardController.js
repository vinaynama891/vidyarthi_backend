import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Expense from '../models/Expense.js';

// @desc    Get dashboard stats (Total Students, Teachers, Fee Aggregates, Expenses, and Total Profit)
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

    // Fetch and sum all expenses
    const expenses = await Expense.find({});
    let totalExpenses = 0;
    expenses.forEach((expense) => {
      totalExpenses += expense.amount;
    });

    // Calculate total profit (total fee billing - expenses)
    const totalProfit = totalFees - totalExpenses;

    res.json({
      totalStudents,
      totalTeachers,
      totalFees,
      paidFees,
      pendingFees,
      totalExpenses,
      totalProfit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
