import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'OnlineTest', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentClass: { type: String, required: true },
    // answers[i] = index of selected option (0-3), or -1 if skipped
    answers: { type: [Number], required: true },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    autoSubmitted: { type: Boolean, default: false }, // true if tab-switch or timer
    autoSubmitReason: { type: String, default: '' },   // 'timer' | 'tab-switch'
    timeTaken: { type: Number, default: 0 }            // seconds
  },
  { timestamps: true }
);

// One attempt per student per test
testAttemptSchema.index({ test: 1, student: 1 }, { unique: true });

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);
export default TestAttempt;
