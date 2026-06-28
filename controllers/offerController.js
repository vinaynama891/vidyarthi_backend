import Offer from '../models/Offer.js';
import fs from 'fs';
import path from 'path';
import { uploadToImageKit } from '../config/imagekit.js';

// @desc    Get all promotional offers
// @route   GET /api/offers
// @access  Public
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new offer
// @route   POST /api/offers
// @access  Private/Admin
export const createOffer = async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Offer image is required' });
    }

    const { title } = req.body;

    // Upload to ImageKit
    const photoUrl = await uploadToImageKit(req.file, '/offers');

    const newOffer = new Offer({
      title: title || '',
      photoUrl
    });

    await newOffer.save();

    res.status(201).json({
      success: true,
      message: 'Offer uploaded successfully',
      data: newOffer
    });
  } catch (error) {
    // Clean up local temp file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle offer active status
// @route   PUT /api/offers/:id/toggle
// @access  Private/Admin
export const toggleOffer = async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }

  const { id } = req.params;

  try {
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    res.status(200).json({
      success: true,
      message: `Offer status updated to ${offer.isActive ? 'Active' : 'Inactive'}`,
      data: offer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
export const deleteOffer = async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }

  const { id } = req.params;

  try {
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Delete local file if it exists (not ImageKit URL)
    if (offer.photoUrl && !offer.photoUrl.startsWith('http')) {
      const filePath = path.join(process.cwd(), offer.photoUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting local file:', err);
        }
      }
    }

    await offer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
