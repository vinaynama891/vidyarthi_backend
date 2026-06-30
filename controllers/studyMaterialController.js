import StudyMaterial from '../models/StudyMaterial.js';
import { uploadToImageKit } from '../config/imagekit.js';

// @desc    Get all study materials
// @route   GET /api/study-materials
// @access  Private (Admin, Student)
export const getStudyMaterials = async (req, res) => {
  try {
    const studyMaterials = await StudyMaterial.find({}).sort({ uploadedAt: -1 });
    
    if (req.userRole === 'student') {
      const student = req.user;
      const unlockedNotesSet = new Set((student.unlockedNotes || []).map(id => id.toString()));
      const isCoachingStudent = student.studentType === 'Regular';

      const secureMaterials = studyMaterials.map(mat => {
        const matObj = mat.toObject();
        const isFree = mat.notesType === 'Free';
        const isExplicitlyUnlocked = unlockedNotesSet.has(mat._id.toString());

        if (isFree || isCoachingStudent || isExplicitlyUnlocked) {
          matObj.isUnlocked = true;
        } else {
          matObj.isUnlocked = false;
          matObj.fileUrl = ''; // Hide download URL for locked items
        }
        return matObj;
      });
      return res.json(secureMaterials);
    }
    
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

    const { title, description, targetClass, notesType, price } = req.body;

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
      targetClass,
      notesType: notesType || 'Free',
      price: notesType === 'Paid' ? (Number(price) || 0) : 0
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

// @desc    Get public study materials (secure, fileUrl hidden for locked items)
// @route   GET /api/study-materials/public
// @access  Public
export const getPublicStudyMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({}).sort({ uploadedAt: 1 }); // Oldest first
    
    const safeMaterials = materials.map(mat => {
      const matObj = mat.toObject();
      
      if (mat.notesType === 'Free') {
        matObj.isFree = true;
      } else {
        matObj.isFree = false;
        matObj.fileUrl = ''; // Hide download URL for locked items
      }
      return matObj;
    });
    
    res.json(safeMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get study materials for logged-in student (secure, fileUrl hidden unless free or unlocked)
// @route   GET /api/study-materials/student
// @access  Private (Student)
export const getStudentStudyMaterials = async (req, res) => {
  try {
    if (req.userRole !== 'student') {
      return res.status(403).json({ message: 'Forbidden: Student access only' });
    }
    
    const student = req.user;
    const studentClass = student.class;
    
    // Get all materials matching this class or 'All'
    const materials = await StudyMaterial.find({
      targetClass: { $in: [studentClass, 'All'] }
    }).sort({ uploadedAt: 1 });
    
    const unlockedNotesSet = new Set((student.unlockedNotes || []).map(id => id.toString()));
    
    const secureMaterials = materials.map(mat => {
      const matObj = mat.toObject();
      
      const isFree = mat.notesType === 'Free';
      const isCoachingStudent = student.studentType === 'Regular';
      const isExplicitlyUnlocked = unlockedNotesSet.has(mat._id.toString());
      
      if (isFree || isCoachingStudent || isExplicitlyUnlocked) {
        matObj.isUnlocked = true;
      } else {
        matObj.isUnlocked = false;
        matObj.fileUrl = ''; // Hide download URL for locked/paid items
      }
      return matObj;
    });
    
    res.json(secureMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

