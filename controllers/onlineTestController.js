import OnlineTest from '../models/OnlineTest.js';
import TestAttempt from '../models/TestAttempt.js';

// ─────────────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────────────

// @desc  Create a new online test (admin)
// @route POST /api/online-tests
// @access Private/Admin
export const createOnlineTest = async (req, res) => {
  try {
    const { title, subject, classes, timeLimit, questions, status } = req.body;
    if (!title || !subject || !classes?.length || !timeLimit || !questions?.length) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    const test = new OnlineTest({ title, subject, classes, timeLimit, questions, status: status || 'draft' });
    const saved = await test.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Get all tests (admin sees all; with attempt counts)
// @route GET /api/online-tests
// @access Private/Admin
export const getAllTests = async (req, res) => {
  try {
    const tests = await OnlineTest.find({}).sort({ createdAt: -1 });
    // Attach attempt count to each test
    const testsWithCounts = await Promise.all(
      tests.map(async (test) => {
        const attemptCount = await TestAttempt.countDocuments({ test: test._id });
        return { ...test.toObject(), attemptCount };
      })
    );
    res.json(testsWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get single test by ID (admin — includes correct answers)
// @route GET /api/online-tests/:id
// @access Private/Admin
export const getTestById = async (req, res) => {
  try {
    const test = await OnlineTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update a test (admin)
// @route PUT /api/online-tests/:id
// @access Private/Admin
export const updateOnlineTest = async (req, res) => {
  try {
    const test = await OnlineTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    const { title, subject, classes, timeLimit, questions, status } = req.body;
    if (title !== undefined) test.title = title;
    if (subject !== undefined) test.subject = subject;
    if (classes !== undefined) test.classes = classes;
    if (timeLimit !== undefined) test.timeLimit = timeLimit;
    if (questions !== undefined) test.questions = questions;
    if (status !== undefined) test.status = status;
    const updated = await test.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Toggle test status between draft and live
// @route PATCH /api/online-tests/:id/toggle
// @access Private/Admin
export const toggleTestStatus = async (req, res) => {
  try {
    const test = await OnlineTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    test.status = test.status === 'live' ? 'draft' : 'live';
    await test.save();
    res.json({ status: test.status, message: `Test is now ${test.status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete a test (admin)
// @route DELETE /api/online-tests/:id
// @access Private/Admin
export const deleteOnlineTest = async (req, res) => {
  try {
    const test = await OnlineTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    await TestAttempt.deleteMany({ test: test._id }); // clean up attempts
    await test.deleteOne();
    res.json({ message: 'Test and all attempts deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all attempts for a specific test (admin)
// @route GET /api/online-tests/:id/attempts
// @access Private/Admin
export const getTestAttempts = async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ test: req.params.id })
      .populate('student', 'name studentId class')
      .sort({ score: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────
// STUDENT CONTROLLERS
// ─────────────────────────────────────────────────────

// @desc  Get live tests for student's class (NO correct answers exposed)
// @route GET /api/online-tests/live
// @access Private/Student
export const getLiveTests = async (req, res) => {
  try {
    const studentClass = req.user.class;
    const tests = await OnlineTest.find({
      status: 'live',
      classes: studentClass
    }).sort({ createdAt: -1 });

    // Strip correct answers before sending to student
    const safeTests = tests.map((test) => ({
      _id: test._id,
      title: test.title,
      subject: test.subject,
      classes: test.classes,
      timeLimit: test.timeLimit,
      totalMarks: test.totalMarks,
      status: test.status,
      createdAt: test.createdAt,
      questionCount: test.questions.length,
      // Questions without correctOption
      questions: test.questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks
      }))
    }));

    res.json(safeTests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Check if student already attempted a test
// @route GET /api/online-tests/:id/my-attempt
// @access Private/Student
export const getMyAttempt = async (req, res) => {
  try {
    const attempt = await TestAttempt.findOne({
      test: req.params.id,
      student: req.user._id
    });
    if (!attempt) return res.json(null);
    // Attach question details with correct answers for the review screen
    const test = await OnlineTest.findById(req.params.id);
    res.json({
      ...attempt.toObject(),
      questions: test ? test.questions : []
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Submit a test attempt
// @route POST /api/online-tests/:id/submit
// @access Private/Student
export const submitAttempt = async (req, res) => {
  try {
    const { answers, autoSubmitted, autoSubmitReason, timeTaken } = req.body;

    // Check if already attempted
    const existing = await TestAttempt.findOne({
      test: req.params.id,
      student: req.user._id
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted this test' });
    }

    const test = await OnlineTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    if (test.status !== 'live') return res.status(400).json({ message: 'This test is no longer live' });

    // Calculate score
    let score = 0;
    const totalMarks = test.totalMarks;
    test.questions.forEach((q, i) => {
      const studentAnswer = answers[i];
      if (studentAnswer !== undefined && studentAnswer !== -1 && studentAnswer === q.correctOption) {
        score += q.marks;
      }
    });
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    const attempt = new TestAttempt({
      test: test._id,
      student: req.user._id,
      studentClass: req.user.class,
      answers,
      score,
      totalMarks,
      percentage,
      autoSubmitted: autoSubmitted || false,
      autoSubmitReason: autoSubmitReason || '',
      timeTaken: timeTaken || 0
    });

    await attempt.save();

    res.status(201).json({
      score,
      totalMarks,
      percentage,
      autoSubmitted: attempt.autoSubmitted,
      autoSubmitReason: attempt.autoSubmitReason,
      questions: test.questions // full questions with correct answers for review
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
