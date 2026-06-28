import mongoose from 'mongoose';

const demoClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DemoClass = mongoose.model('DemoClass', demoClassSchema);
export default DemoClass;
