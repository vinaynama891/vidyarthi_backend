import CoursePage from '../models/CoursePage.js';
import fs from 'fs';
import path from 'path';
import { uploadToImageKit } from '../config/imagekit.js';

// @desc    Get course page by name
// @route   GET /api/courses/:courseName
// @access  Public
export const getCoursePage = async (req, res) => {
  const { courseName } = req.params;

  try {
    let page = await CoursePage.findOne({ courseName });

    // If page doesn't exist, create an empty one
    if (!page) {
      page = new CoursePage({
        courseName,
        blocks: []
      });
      await page.save();
    }

    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a content block to course page
// @route   POST /api/courses/:courseName/blocks
// @access  Private/Admin
export const addBlock = async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }

  const { courseName } = req.params;
  const { type, title, content } = req.body;

  if (!type) {
    return res.status(400).json({ message: 'Block type is required' });
  }

  try {
    let page = await CoursePage.findOne({ courseName });

    if (!page) {
      page = new CoursePage({
        courseName,
        blocks: []
      });
    }

    let photoUrl = '';
    // If image file is uploaded
    if (req.file) {
      const folderName = courseName.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
      photoUrl = await uploadToImageKit(req.file, `/courses/${folderName}`);
    }

    const newBlock = {
      type,
      title: title || '',
      content: content || '',
      photoUrl,
      order: page.blocks.length
    };

    page.blocks.push(newBlock);
    page.updatedAt = Date.now();
    await page.save();

    res.status(201).json({
      success: true,
      message: 'Block added successfully',
      data: page
    });
  } catch (error) {
    // Clean up local temp file on error
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

// @desc    Delete a block from course page
// @route   DELETE /api/courses/:courseName/blocks/:blockId
// @access  Private/Admin
export const deleteBlock = async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }

  const { courseName, blockId } = req.params;

  try {
    const page = await CoursePage.findOne({ courseName });

    if (!page) {
      return res.status(404).json({ message: 'Course page not found' });
    }

    const block = page.blocks.id(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Content block not found' });
    }

    // Delete local photo file if it exists (not ImageKit url)
    if (block.photoUrl && !block.photoUrl.startsWith('http')) {
      const filePath = path.join(process.cwd(), block.photoUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting local block file:', err);
        }
      }
    }

    // Remove block using Mongoose pull
    page.blocks.pull(blockId);
    page.updatedAt = Date.now();
    await page.save();

    res.status(200).json({
      success: true,
      message: 'Content block deleted successfully',
      data: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
