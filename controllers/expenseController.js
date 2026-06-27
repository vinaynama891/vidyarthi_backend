import Expense from '../models/Expense.js';

// @desc    Get expenses with optional month/year filter
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};

    if (month && year) {
      const m = parseInt(month) - 1; // JS month is 0-11
      const y = parseInt(year);
      
      const startDate = new Date(y, m, 1);
      const endDate = new Date(y, m + 1, 0, 23, 59, 59); // Last day of month

      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (year) {
      const y = parseInt(year);
      const startDate = new Date(y, 0, 1);
      const endDate = new Date(y, 11, 31, 23, 59, 59);
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
export const addExpense = async (req, res) => {
  const { title, category, amount, date, description } = req.body;

  try {
    const expense = new Expense({
      title,
      category,
      amount,
      date: date || new Date(),
      description
    });

    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (expense) {
      await expense.deleteOne();
      res.json({ message: 'Expense deleted successfully' });
    } else {
      res.status(404).json({ message: 'Expense not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
