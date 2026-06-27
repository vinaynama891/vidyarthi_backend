import Achievement from '../models/Achievement.js';
import fs from 'fs';
import path from 'path';
import { uploadToImageKit } from '../config/imagekit.js';


// @desc    Get achievements (max 6, sorted by order)
// @route   GET /api/achievements
// @access  Public
export const getAchievements = async (req, res) => {
  try {
    // If request comes from admin, we might want to return all, but since there is a hard limit of 6 total,
    // we can always return all achievements (sorted by order, then by createdAt)
    const achievements = await Achievement.find({}).sort({ order: 1, _id: 1 });
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new achievement (Max 6 enforced)
// @route   POST /api/achievements
// @access  Private
export const createAchievement = async (req, res) => {
  try {
    // Enforce max 6 achievements check
    const count = await Achievement.countDocuments({});
    if (count >= 6) {
      // Clean up uploaded file if check fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Maximum limit of 6 achievements reached. Delete one to add a new one.' });
    }

    const { studentName, fatherName, class: studentClass, description, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Photo upload is required' });
    }

    // Upload photo to ImageKit
    const photoUrl = await uploadToImageKit(req.file, '/achievements');

    const achievement = new Achievement({
      photoUrl,
      studentName,
      fatherName,
      class: studentClass,
      description,
      isPublished: true,
      order: order ? parseInt(order) : count // Default order is the count
    });

    const createdAchievement = await achievement.save();
    res.status(201).json(createdAchievement);
  } catch (error) {
    // Clean up uploaded file if save fails
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('File cleanup error:', err);
      }
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update achievement (supports reordering or changing details)
// @route   PUT /api/achievements/:id
// @access  Private
export const updateAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (achievement) {
      achievement.studentName = req.body.studentName || achievement.studentName;
      achievement.fatherName = req.body.fatherName || achievement.fatherName;
      achievement.class = req.body.class || achievement.class;
      achievement.description = req.body.description || achievement.description;
      achievement.isPublished = req.body.isPublished !== undefined ? req.body.isPublished : achievement.isPublished;
      achievement.order = req.body.order !== undefined ? parseInt(req.body.order) : achievement.order;

      // Handle photo update if a new file is uploaded
      if (req.file) {
        // Delete old photo if it exists locally
        if (achievement.photoUrl && !achievement.photoUrl.startsWith('http')) {
          const oldPath = path.join(process.cwd(), achievement.photoUrl);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (err) {
              console.error('Error deleting old photo:', err);
            }
          }
        }
        achievement.photoUrl = await uploadToImageKit(req.file, '/achievements');
      }

      const updatedAchievement = await achievement.save();
      res.json(updatedAchievement);
    } else {
      // Clean up uploaded file if achievement not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ message: 'Achievement not found' });
    }
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete achievement
// @route   DELETE /api/achievements/:id
// @access  Private
export const deleteAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (achievement) {
      // Delete local photo file if it exists locally
      if (achievement.photoUrl && !achievement.photoUrl.startsWith('http')) {
        const filePath = path.join(process.cwd(), achievement.photoUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      }

      await achievement.deleteOne();
      res.json({ message: 'Achievement removed successfully' });
    } else {
      res.status(404).json({ message: 'Achievement not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
