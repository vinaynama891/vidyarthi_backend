import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  photoUrl: {
    type: String,
    required: true
  },
  studentName: {
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
  description: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
