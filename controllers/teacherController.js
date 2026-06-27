import Teacher from '../models/Teacher.js';

// Helper to generate a unique 5-letter teacher ID
const generateUniqueTeacherId = async () => {
  let isUnique = false;
  let id = '';
  while (!isUnique) {
    id = Math.random().toString(36).substring(2, 7).toUpperCase();
    const existing = await Teacher.findOne({ teacherId: id });
    if (!existing) {
      isUnique = true;
    }
  }
  return id;
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
export const getTeachers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(query).sort({ joiningDate: -1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new teacher
// @route   POST /api/teachers/register
// @access  Private
export const registerTeacher = async (req, res) => {
  const {
    name,
    fatherName,
    subject,
    classesAssigned,
    phone,
    email,
    salary,
    joiningDate
  } = req.body;

  try {
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this email already exists' });
    }

    const teacherId = await generateUniqueTeacherId();
    const teacher = new Teacher({
      teacherId,
      name,
      fatherName,
      subject,
      classesAssigned,
      phone,
      email,
      salary,
      joiningDate: joiningDate || new Date(),
      password: "Vidyarthi@20"
    });

    const createdTeacher = await teacher.save();
    res.status(201).json(createdTeacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a teacher
// @route   PUT /api/teachers/:id
// @access  Private
export const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (teacher) {
      teacher.name = req.body.name || teacher.name;
      teacher.fatherName = req.body.fatherName || teacher.fatherName;
      teacher.subject = req.body.subject || teacher.subject;
      teacher.classesAssigned = req.body.classesAssigned || teacher.classesAssigned;
      teacher.phone = req.body.phone || teacher.phone;
      teacher.email = req.body.email || teacher.email;
      teacher.salary = req.body.salary !== undefined ? req.body.salary : teacher.salary;
      teacher.joiningDate = req.body.joiningDate || teacher.joiningDate;

      const updatedTeacher = await teacher.save();
      res.json(updatedTeacher);
    } else {
      res.status(404).json({ message: 'Teacher not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a teacher
// @route   DELETE /api/teachers/:id
// @access  Private
export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (teacher) {
      await teacher.deleteOne();
      res.json({ message: 'Teacher removed successfully' });
    } else {
      res.status(404).json({ message: 'Teacher not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get teacher profile
// @route   GET /api/teachers/profile
// @access  Private
export const getTeacherProfile = async (req, res) => {
  try {
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
