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

// @desc    Get detailed revenue history (weekly, monthly, annual)
// @route   GET /api/dashboard/revenue
// @access  Private
export const getRevenueStats = async (req, res) => {
  try {
    const students = await Student.find({});
    const expenses = await Expense.find({});

    const weeklyMap = {};
    const monthlyMap = {};
    const yearlyMap = {};

    // Helper to get week start (Monday)
    const getWeekKey = (dateVal) => {
      const d = new Date(dateVal);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday.toISOString();
    };

    // 1. Process Student Installments
    students.forEach((student) => {
      let installmentsSum = 0;
      if (student.installments && student.installments.length > 0) {
        student.installments.forEach((inst) => {
          installmentsSum += inst.amount || 0;

          const date = new Date(inst.date);
          if (isNaN(date.getTime())) return;

          const year = date.getFullYear();
          const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const weekKey = getWeekKey(date);

          if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { fees: 0, salary: 0, otherExpense: 0 };
          if (!monthlyMap[month]) monthlyMap[month] = { fees: 0, salary: 0, otherExpense: 0 };
          if (!yearlyMap[year]) yearlyMap[year] = { fees: 0, salary: 0, otherExpense: 0 };

          weeklyMap[weekKey].fees += inst.amount || 0;
          monthlyMap[month].fees += inst.amount || 0;
          yearlyMap[year].fees += inst.amount || 0;
        });
      }

      // If the student has paid fees that aren't logged as explicit installments,
      // count the difference and attribute it to the student's registration date.
      const diff = (student.paidFees || 0) - installmentsSum;
      if (diff > 0) {
        const date = student.createdAt ? new Date(student.createdAt) : new Date();
        const year = date.getFullYear();
        const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const weekKey = getWeekKey(date);

        if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { fees: 0, salary: 0, otherExpense: 0 };
        if (!monthlyMap[month]) monthlyMap[month] = { fees: 0, salary: 0, otherExpense: 0 };
        if (!yearlyMap[year]) yearlyMap[year] = { fees: 0, salary: 0, otherExpense: 0 };

        weeklyMap[weekKey].fees += diff;
        monthlyMap[month].fees += diff;
        yearlyMap[year].fees += diff;
      }
    });

    // 2. Process Expenses (including Salaries)
    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const weekKey = getWeekKey(date);

      if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { fees: 0, salary: 0, otherExpense: 0 };
      if (!monthlyMap[month]) monthlyMap[month] = { fees: 0, salary: 0, otherExpense: 0 };
      if (!yearlyMap[year]) yearlyMap[year] = { fees: 0, salary: 0, otherExpense: 0 };

      const amount = exp.amount || 0;
      if (exp.category === 'Salary') {
        weeklyMap[weekKey].salary += amount;
        monthlyMap[month].salary += amount;
        yearlyMap[year].salary += amount;
      } else {
        weeklyMap[weekKey].otherExpense += amount;
        monthlyMap[month].otherExpense += amount;
        yearlyMap[year].otherExpense += amount;
      }
    });

    // 3. Format weekly records (sorted descending by weekKey)
    const weekly = Object.keys(weeklyMap)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((key) => {
        const wStart = new Date(key);
        const wEnd = new Date(wStart);
        wEnd.setDate(wStart.getDate() + 6);
        const label = `${wStart.getDate()} ${wStart.toLocaleString('default', { month: 'short' })} - ${wEnd.getDate()} ${wEnd.toLocaleString('default', { month: 'short' })} ${wEnd.getFullYear()}`;
        const data = weeklyMap[key];
        const netProfit = data.fees - (data.salary + data.otherExpense);
        return { label, ...data, netProfit };
      });

    // 4. Format monthly records (sorted descending)
    const monthly = Object.keys(monthlyMap)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [y, m] = key.split('-');
        const label = `${new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'long' })} ${y}`;
        const data = monthlyMap[key];
        const netProfit = data.fees - (data.salary + data.otherExpense);
        return { label, ...data, netProfit };
      });

    // 5. Format yearly records (sorted descending)
    const yearly = Object.keys(yearlyMap)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .map((key) => {
        const label = `${key}`;
        const data = yearlyMap[key];
        const netProfit = data.fees - (data.salary + data.otherExpense);
        return { label, ...data, netProfit };
      });

    res.json({ weekly, monthly, yearly });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

