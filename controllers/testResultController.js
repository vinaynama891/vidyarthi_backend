import TestResult from '../models/TestResult.js';

// @desc    Get all test results (with optional class filtering)
// @route   GET /api/results
// @access  Private
export const getTestResults = async (req, res) => {
  try {
    const { classFilter } = req.query;
    let query = {};

    if (req.userRole === 'student') {
      // Students can only see published results for their own class
      query.isPublished = true;
      query.class = req.user.class;
    } else {
      if (classFilter) {
        query.class = classFilter;
      }
    }

    const results = await TestResult.find(query).sort({ testDate: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Publish a test result
// @route   PUT /api/results/:id/publish
// @access  Private
export const publishTestResult = async (req, res) => {
  try {
    const testResult = await TestResult.findById(req.params.id);

    if (testResult) {
      testResult.isPublished = true;
      const updatedResult = await testResult.save();
      res.json(updatedResult);
    } else {
      res.status(404).json({ message: 'Test result not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit a new test result (e.g. by a teacher or admin)
// @route   POST /api/results
// @access  Private
export const createTestResult = async (req, res) => {
  const { class: testClass, subject, teacherId, testDate, results } = req.body;

  try {
    const testResult = new TestResult({
      class: testClass,
      subject,
      teacherId,
      testDate: testDate || new Date(),
      results,
      isPublished: false
    });

    const createdResult = await testResult.save();
    res.status(201).json(createdResult);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
