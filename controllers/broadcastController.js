import Broadcast from '../models/Broadcast.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Enquiry from '../models/Enquiry.js';
import { uploadToImageKit } from '../config/imagekit.js';
import fs from 'fs';

// Helper to format phone numbers to international standard (91XXXXXXXXXX)
const formatPhone = (phone) => {
  let cleaned = phone.replace(/\D/g, ''); // keep only digits
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
};

// Helper function to send single message via UltraMsg
const sendWhatsAppMessage = async (phone, title, description, fileUrl) => {
  const token = process.env.WHATSAPP_API_TOKEN;
  const apiBaseUrl = process.env.WHATSAPP_API_URL;
  
  if (!token || !apiBaseUrl) {
    throw new Error('WhatsApp API configuration (WHATSAPP_API_TOKEN or WHATSAPP_API_URL) is missing in .env');
  }

  const isPdf = fileUrl && (
    fileUrl.toLowerCase().endsWith('.pdf') || 
    fileUrl.toLowerCase().split('?')[0].endsWith('.pdf') ||
    fileUrl.includes('pdf')
  );

  const endpoint = fileUrl ? (isPdf ? '/messages/document' : '/messages/image') : '/messages/chat';
  // Standardize trailing slash check
  const baseUrlClean = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${baseUrlClean}${endpoint}`;
  
  const params = new URLSearchParams();
  params.append('token', token);
  params.append('to', phone);
  
  if (fileUrl) {
    if (isPdf) {
      params.append('document', fileUrl);
      const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'document';
      params.append('filename', `${safeTitle}.pdf`);
      params.append('caption', `*${title}*\n\n${description}`);
    } else {
      params.append('image', fileUrl);
      params.append('caption', `*${title}*\n\n${description}`);
    }
  } else {
    params.append('body', `*${title}*\n\n${description}`);
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`UltraMsg Response Error: ${response.status} - ${text}`);
  }
  
  return await response.json();
};

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

// @desc    Send broadcast message via WhatsApp
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

    if (!isAnnounce) {
      // Collect recipient phone numbers
      const recipientPhones = new Set();

      // Fetch students phone numbers from selected classes
      if (parsedClasses.length > 0) {
        const students = await Student.find({ class: { $in: parsedClasses } }).select('phone');
        students.forEach(std => {
          if (std.phone) recipientPhones.add(std.phone.trim());
        });
      }

      // Fetch teachers phone numbers from selected teacher IDs
      if (parsedTeachers.length > 0) {
        const teachersList = await Teacher.find({ _id: { $in: parsedTeachers } }).select('phone');
        teachersList.forEach(tch => {
          if (tch.phone) recipientPhones.add(tch.phone.trim());
        });
      }

      // Fetch enquiries phone numbers from selected enquiry IDs
      if (parsedEnquiries.length > 0) {
        const enquiriesList = await Enquiry.find({ _id: { $in: parsedEnquiries } }).select('mobileNumber');
        enquiriesList.forEach(enq => {
          if (enq.mobileNumber) recipientPhones.add(enq.mobileNumber.trim());
        });
      }

      const uniquePhoneNumbers = Array.from(recipientPhones);
      totalCount = uniquePhoneNumbers.length;

      if (totalCount === 0) {
        return res.status(400).json({ message: 'No recipients found for the selected targets' });
      }

      // Send messages in loop
      for (const phone of uniquePhoneNumbers) {
        try {
          const formatted = formatPhone(phone);
          await sendWhatsAppMessage(formatted, title, description, imageUrl);
          successCount++;
        } catch (err) {
          console.error(`Failed to send WhatsApp message to ${phone}:`, err.message);
          failedCount++;
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

    res.status(201).json({
      message: isAnnounce 
        ? 'Announcement posted successfully!' 
        : `Broadcast finished. Sent: ${successCount}, Failed: ${failedCount}`,
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
