import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  photoUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const Gallery = mongoose.model('Gallery', gallerySchema);
export default Gallery;
