import Student from '../models/Student.js';

// Helper to generate a unique 5-letter student ID
const generateUniqueStudentId = async () => {
  let isUnique = false;
  let id = '';
  while (!isUnique) {
    id = Math.random().toString(36).substring(2, 7).toUpperCase();
    const existing = await Student.findOne({ studentId: id });
    if (!existing) {
      isUnique = true;
    }
  }
  return id;
};

// @desc    Get all students (with search and class filter)
// @route   GET /api/students
// @access  Private
export const getStudents = async (req, res) => {
  try {
    const { search, classFilter } = req.query;
    let query = {};

    if (classFilter) {
      query.class = classFilter;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).sort({ name: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new student
// @route   POST /api/students/register
// @access  Private
export const registerStudent = async (req, res) => {
  const {
    name,
    fatherName,
    class: studentClass,
    phone,
    goodiesStatus,
    discount,
    totalFees,
    paidFees,
    goodiesTotalFee,
    goodiesPaidFee,
    address,
    studentType,
    unlockedNotes
  } = req.body;

  try {
    const studentId = await generateUniqueStudentId();
    const student = new Student({
      studentId,
      name,
      fatherName,
      class: studentClass,
      phone,
      password: req.body.password || "Vidyarthi@20",
      goodiesStatus: goodiesStatus || 'Pending',
      discount: discount || 0,
      totalFees: totalFees || 0,
      paidFees: paidFees || 0,
      goodiesTotalFee: goodiesTotalFee || 0,
      goodiesPaidFee: goodiesPaidFee || 0,
      address,
      studentType: studentType || 'Regular',
      unlockedNotes: unlockedNotes || [],
      installments: req.body.installments || []
    });

    const createdStudent = await student.save();
    res.status(201).json(createdStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (student) {
      student.name = req.body.name || student.name;
      student.fatherName = req.body.fatherName || student.fatherName;
      student.class = req.body.class || student.class;
      student.phone = req.body.phone || student.phone;
      student.goodiesStatus = req.body.goodiesStatus || student.goodiesStatus;
      student.discount = req.body.discount !== undefined ? req.body.discount : student.discount;
      student.totalFees = req.body.totalFees !== undefined ? req.body.totalFees : student.totalFees;
      student.paidFees = req.body.paidFees !== undefined ? req.body.paidFees : student.paidFees;
      student.goodiesTotalFee = req.body.goodiesTotalFee !== undefined ? req.body.goodiesTotalFee : student.goodiesTotalFee;
      student.goodiesPaidFee = req.body.goodiesPaidFee !== undefined ? req.body.goodiesPaidFee : student.goodiesPaidFee;
      student.address = req.body.address || student.address;
      student.studentType = req.body.studentType || student.studentType;
      if (req.body.unlockedNotes !== undefined) {
        student.unlockedNotes = req.body.unlockedNotes;
      }
      if (req.body.installments !== undefined) {
        student.installments = req.body.installments;
      }

      const updatedStudent = await student.save();
      res.json(updatedStudent);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (student) {
      await student.deleteOne();
      res.json({ message: 'Student removed successfully' });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private
export const getStudentProfile = async (req, res) => {
  try {
    if (req.userRole !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

