import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  fileUrl: {
    type: String,
    required: true
  },
  targetClass: {
    type: String,
    required: true
  },
  notesType: {
    type: String,
    enum: ['Free', 'Paid'],
    default: 'Free'
  },
  price: {
    type: Number,
    default: 0
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
export default StudyMaterial;
