import Broadcast from '../models/Broadcast.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Enquiry from '../models/Enquiry.js';
import { uploadToImageKit } from '../config/imagekit.js';
import fs from 'fs';

// @desc    Get all broadcasts history
// @route   GET /api/broadcasts
// @access  Private (Admin)
export const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({}).sort({ sentAt: -1 });
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send broadcast message via In-App Notification Board
// @route   POST /api/broadcasts
// @access  Private (Admin)
export const sendBroadcast = async (req, res) => {
  try {
    const { title, description, classes, teachers, enquiries, isAnnouncement } = req.body;
    const isAnnounce = isAnnouncement === 'true' || isAnnouncement === true;
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    let parsedClasses = [];
    let parsedTeachers = [];
    let parsedEnquiries = [];

    if (classes) {
      try {
        parsedClasses = JSON.parse(classes);
      } catch (e) {
        parsedClasses = classes.split(',').map(c => c.trim()).filter(Boolean);
      }
    }

    if (teachers) {
      try {
        parsedTeachers = JSON.parse(teachers);
      } catch (e) {
        parsedTeachers = teachers.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    if (enquiries) {
      try {
        parsedEnquiries = JSON.parse(enquiries);
      } catch (e) {
        parsedEnquiries = enquiries.split(',').map(eId => eId.trim()).filter(Boolean);
      }
    }

    if (parsedClasses.length === 0 && parsedTeachers.length === 0 && parsedEnquiries.length === 0) {
      return res.status(400).json({ message: 'Please select at least one class, teacher, or enquiry to target' });
    }

    // Upload image to ImageKit if provided
    let imageUrl = '';
    if (req.file) {
      try {
        imageUrl = await uploadToImageKit(req.file, '/broadcasts');
      } catch (err) {
        console.error('ImageKit upload error:', err);
        return res.status(500).json({ message: `Image upload failed: ${err.message}` });
      }
    }

    let successCount = 0;
    let failedCount = 0;
    let totalCount = 0;

    // Calculate total targeted audience count for stats
    if (parsedClasses.length > 0) {
      totalCount += await Student.countDocuments({ class: { $in: parsedClasses } });
    }
    if (parsedTeachers.length > 0) {
      totalCount += await Teacher.countDocuments({ _id: { $in: parsedTeachers } });
    }
    if (parsedEnquiries.length > 0) {
      totalCount += await Enquiry.countDocuments({ _id: { $in: parsedEnquiries } });
    }

    successCount = totalCount;

    // Save broadcast record
    const newBroadcast = new Broadcast({
      title,
      description,
      imageUrl,
      isAnnouncement: isAnnounce,
      targets: {
        classes: parsedClasses,
        teachers: parsedTeachers,
        enquiries: parsedEnquiries
      },
      stats: {
        successCount,
        failedCount,
        totalCount
      }
    });

    const savedBroadcast = await newBroadcast.save();

    res.status(201).json({
      message: isAnnounce 
        ? 'Announcement posted successfully!' 
        : `Broadcast posted successfully in-app to ${successCount} recipients!`,
      broadcast: savedBroadcast
    });

  } catch (error) {
    // Cleanup local temp file if still exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('File cleanup error in catch:', err);
      }
    }
    console.error('Broadcast server error:', error);
    res.status(500).json({ message: error.message });
  }
};

