import Enquiry from '../models/Enquiry.js';

// @desc    Submit a new enquiry
// @route   POST /api/enquiries
// @access  Public
export const submitEnquiry = async (req, res) => {
  const { studentName, fatherName, mobileNumber, title, description } = req.body;

  if (!studentName || !fatherName || !mobileNumber || !title || !description) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newEnquiry = new Enquiry({
      studentName,
      fatherName,
      mobileNumber,
      title,
      description
    });

    await newEnquiry.save();

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private/Admin
export const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an enquiry
// @route   DELETE /api/enquiries/:id
// @access  Private/Admin
export const deleteEnquiry = async (req, res) => {
  const { id } = req.params;

  try {
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    await enquiry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
