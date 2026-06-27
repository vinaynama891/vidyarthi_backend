import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Rent', 'Salary', 'Electricity', 'Stationary', 'Maintenance', 'Other']
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String
  }
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
