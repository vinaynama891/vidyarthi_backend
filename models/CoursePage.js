import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['card', 'image', 'paragraph'],
    required: true
  },
  title: {
    type: String,
    required: false
  },
  content: {
    type: String,
    required: false
  },
  photoUrl: {
    type: String,
    required: false
  },
  order: {
    type: Number,
    default: 0
  }
});

const coursePageSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    unique: true
  },
  blocks: [blockSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const CoursePage = mongoose.model('CoursePage', coursePageSchema);
export default CoursePage;
