import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  teacherId: {
    type: String,
    required: true
  },
  testDate: {
    type: Date,
    required: true
  },
  results: [{
    studentId: {
      type: String,
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    marks: {
      type: Number,
      required: true
    },
    totalMarks: {
      type: Number,
      required: true
    },
    grade: {
      type: String,
      required: true
    }
  }],
  isPublished: {
    type: Boolean,
    default: false
  }
});

const TestResult = mongoose.model('TestResult', testResultSchema);
export default TestResult;
