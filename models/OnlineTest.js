import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true }, // exactly 4 options
  correctOption: { type: Number, required: true }, // 0-3 index
  marks: { type: Number, required: true, default: 1 }
});

const onlineTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    classes: { type: [String], required: true }, // multiple classes
    timeLimit: { type: Number, required: true }, // in minutes
    status: { type: String, enum: ['draft', 'live'], default: 'draft' },
    questions: [questionSchema],
    totalMarks: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Auto-calculate totalMarks before save
onlineTestSchema.pre('save', function (next) {
  this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  next();
});

const OnlineTest = mongoose.model('OnlineTest', onlineTestSchema);
export default OnlineTest;
