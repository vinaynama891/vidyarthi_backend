import Broadcast from '../models/Broadcast.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Enquiry from '../models/Enquiry.js';
import { uploadToImageKit } from '../config/imagekit.js';
import { sendEmail } from '../config/nodemailer.js';
import fs from 'fs';

// @desc    Get all broadcasts history
// @route   GET /api/broadcasts
// @access  Private (Admin)
export const getBroadcasts = async (req, res) => {
  try {
    let broadcasts;
    if (req.userRole === 'admin') {
      broadcasts = await Broadcast.find({}).sort({ sentAt: -1 });
    } else if (req.userRole === 'student') {
      // Student only sees broadcasts that target their class or general broadcasts
      broadcasts = await Broadcast.find({
        $or: [
          { 'targets.classes': req.user.class },
          {
            'targets.classes': { $size: 0 },
            'targets.teachers': { $size: 0 },
            'targets.enquiries': { $size: 0 }
          }
        ]
      }).sort({ sentAt: -1 });
    } else if (req.userRole === 'teacher') {
      // Teacher only sees broadcasts that target them specifically or target their classes, or general
      broadcasts = await Broadcast.find({
        $or: [
          { 'targets.teachers': req.user._id.toString() },
          { 'targets.teachers': req.user._id },
          { 'targets.classes': { $in: req.user.classesAssigned || [] } },
          {
            'targets.classes': { $size: 0 },
            'targets.teachers': { $size: 0 },
            'targets.enquiries': { $size: 0 }
          }
        ]
      }).sort({ sentAt: -1 });
    } else {
      broadcasts = [];
    }
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
    const { title, description, classes, teachers, enquiries, isAnnouncement, sendEmail: sendEmailReq } = req.body;
    const isAnnounce = isAnnouncement === 'true' || isAnnouncement === true;
    const isSendEmail = sendEmailReq === 'true' || sendEmailReq === true;
    
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

    // Send emails (always to targeted enquiries)
    let emailSuccessCount = 0;
    let emailFailedCount = 0;

    if (parsedEnquiries.length > 0) {
      const targetedEnquiries = await Enquiry.find({ _id: { $in: parsedEnquiries } });
      
      for (const enq of targetedEnquiries) {
        if (enq.email) {
          const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <h2 style="color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; font-weight: 800; margin-bottom: 20px;">${title}</h2>
              <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">${description}</p>
              ${imageUrl ? `<div style="margin-top: 20px; text-align: center;"><img src="${imageUrl}" alt="Attachment" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;"/></div>` : ''}
              <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;"/>
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an official announcement from Vidyarthi Classes Kota.</p>
            </div>
          `;
          
          const mailResult = await sendEmail({
            to: enq.email,
            subject: title,
            html: htmlContent,
            text: description
          });
          
          if (mailResult.success) {
            emailSuccessCount++;
          } else {
            emailFailedCount++;
          }
        } else {
          emailFailedCount++; // Enquiry doesn't have an email address
        }
      }
    }

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

    let successMessage = isAnnounce 
      ? 'Announcement posted successfully!' 
      : `Broadcast posted successfully in-app to ${successCount} recipients!`;
      
    if (parsedEnquiries.length > 0) {
      successMessage += ` Email sent to ${emailSuccessCount} candidates (${emailFailedCount} skipped/failed).`;
    }

    res.status(201).json({
      message: successMessage,
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

