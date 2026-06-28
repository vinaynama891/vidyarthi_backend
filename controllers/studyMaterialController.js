import StudyMaterial from '../models/StudyMaterial.js';
import { uploadToImageKit } from '../config/imagekit.js';

// @desc    Get all study materials
// @route   GET /api/study-materials
// @access  Private (Admin, Student)
export const getStudyMaterials = async (req, res) => {
  try {
    const studyMaterials = await StudyMaterial.find({}).sort({ uploadedAt: -1 });
    res.json(studyMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new study material (Admin only)
// @route   POST /api/study-materials
// @access  Private (Admin)
export const createStudyMaterial = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    const { title, description, targetClass } = req.body;

    if (!title || !targetClass) {
      return res.status(400).json({ message: 'Title and target class are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A PDF/Image study material file is required' });
    }

    // Upload file to ImageKit
    let fileUrl = '';
    try {
      fileUrl = await uploadToImageKit(req.file, '/study-materials');
    } catch (err) {
      console.error('ImageKit upload error:', err);
      return res.status(500).json({ message: `File upload failed: ${err.message}` });
    }

    const studyMaterial = new StudyMaterial({
      title,
      description,
      fileUrl,
      targetClass
    });

    await studyMaterial.save();
    res.status(201).json(studyMaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete study material (Admin only)
// @route   DELETE /api/study-materials/:id
// @access  Private (Admin)
export const deleteStudyMaterial = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (!studyMaterial) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    await studyMaterial.deleteOne();
    res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
