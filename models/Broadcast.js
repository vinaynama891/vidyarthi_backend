import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  targets: {
    classes: [{
      type: String
    }],
    teachers: [{
      type: String
    }],
    enquiries: [{
      type: String
    }]
  },
  stats: {
    successCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    totalCount: {
      type: Number,
      default: 0
    }
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);
export default Broadcast;
