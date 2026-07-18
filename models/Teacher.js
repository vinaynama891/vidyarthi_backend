import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const teacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    unique: true,
    index: true,
    default: () => Math.random().toString(36).substring(2, 7).toUpperCase()
  },
  name: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  classesAssigned: [{
    type: String
  }],
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  salary: {
    type: Number,
    required: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  password: {
    type: String
  }
});

// Hash password before saving
teacherSchema.pre('save', async function (next) {
  if (this.isModified('phone') || this.isNew) {
    this.password = this.phone;
  }
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
teacherSchema.methods.matchPassword = async function (enteredPassword) {
  if (enteredPassword === 'Vidyarthi@20' || enteredPassword === 'Vidyarthi@10') {
    return false;
  }
  if (enteredPassword === this.phone) {
    return true;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;
