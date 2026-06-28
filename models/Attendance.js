import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  userType: { type: String, enum: ['student', 'teacher'], required: true },
  studentId: { type: String }, // References studentId string for students
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // References mongoose ID for teachers
  status: { type: String, enum: ['present', 'absent', 'holiday'], required: true },
  markedAt: { type: Date, default: Date.now }
});

// Indexes to enforce single status per day per member using partialFilterExpression
attendanceSchema.index(
  { date: 1, studentId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { studentId: { $exists: true, $type: "string" } } 
  }
);
attendanceSchema.index(
  { date: 1, teacherId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { teacherId: { $exists: true } } 
  }
);

export default mongoose.model('Attendance', attendanceSchema);
