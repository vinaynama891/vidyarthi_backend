import Gallery from '../models/Gallery.js';
import fs from 'fs';
import path from 'path';
import { uploadToImageKit } from '../config/imagekit.js';


// @desc    Get all gallery photos
// @route   GET /api/gallery
// @access  Public
export const getGallery = async (req, res) => {
  try {
    const photos = await Gallery.find({}).sort({ uploadedAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload multiple photos
// @route   POST /api/gallery/upload
// @access  Private
export const uploadPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one photo is required' });
    }

    const savedPhotos = await Promise.all(
      req.files.map(async (file) => {
        const photoUrl = await uploadToImageKit(file, '/gallery');
        const newPhoto = new Gallery({ photoUrl });
        return await newPhoto.save();
      })
    );

    res.status(201).json({
      message: 'Photos uploaded successfully',
      photos: savedPhotos
    });
  } catch (error) {
    // Clean up uploaded files if DB save fails
    if (req.files) {
      req.files.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.error('File cleanup error:', err);
        }
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a photo from gallery
// @route   DELETE /api/gallery/:id
// @access  Private
export const deletePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);

    if (photo) {
      // Delete from filesystem if local
      if (photo.photoUrl && !photo.photoUrl.startsWith('http')) {
        const filePath = path.join(process.cwd(), photo.photoUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error deleting photo file:', err);
          }
        }
      }

      await photo.deleteOne();
      res.json({ message: 'Photo deleted successfully' });
    } else {
      res.status(404).json({ message: 'Photo not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
