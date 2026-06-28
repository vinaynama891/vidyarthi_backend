import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
  studentId: {
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
  class: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    default: "Vidyarthi@20"
  },
  goodiesStatus: {
    type: String,
    enum: ['Pending', 'Bag & Books', 'T-Shirt Only', 'All Distributed'],
    default: 'Pending'
  },
  discount: {
    type: Number,
    default: 0
  },
  totalFees: {
    type: Number,
    required: true
  },
  paidFees: {
    type: Number,
    default: 0
  },
  goodiesTotalFee: {
    type: Number,
    default: 0
  },
  goodiesPaidFee: {
    type: Number,
    default: 0
  },
  address: {
    type: String
  },
  installments: [
    {
      date: {
        type: Date,
        default: Date.now
      },
      amount: {
        type: Number,
        required: true
      },
      method: {
        type: String,
        enum: ['Cash', 'Online', 'Other'],
        default: 'Cash'
      },
      remarks: {
        type: String,
        default: ''
      }
    }
  ],
  studentType: {
    type: String,
    enum: ['Regular', 'NotesOnly'],
    default: 'Regular'
  },
  unlockedNotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyMaterial'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);
export default Student;
