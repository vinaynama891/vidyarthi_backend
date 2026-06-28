import DemoClass from '../models/DemoClass.js';

// @desc    Get all demo classes
// @route   GET /api/demo-classes
// @access  Public
export const getDemoClasses = async (req, res) => {
  try {
    const demoClasses = await DemoClass.find().sort({ createdAt: -1 });
    res.status(200).json(demoClasses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a demo class
// @route   POST /api/demo-classes
// @access  Private/Admin
export const createDemoClass = async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }

  const { title, videoUrl, description } = req.body;

  if (!title || !videoUrl) {
    return res.status(400).json({ message: 'Title and Video URL are required' });
  }

  try {
    const newDemoClass = new DemoClass({
      title,
      videoUrl,
      description
    });

    await newDemoClass.save();

    res.status(201).json({
      success: true,
      message: 'Demo class created successfully',
      data: newDemoClass
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a demo class
// @route   DELETE /api/demo-classes/:id
// @access  Private/Admin
export const deleteDemoClass = async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }

  const { id } = req.params;

  try {
    const demoClass = await DemoClass.findById(id);

    if (!demoClass) {
      return res.status(404).json({ message: 'Demo class not found' });
    }

    await demoClass.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Demo class deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
