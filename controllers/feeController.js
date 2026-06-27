import FeeStructure from '../models/FeeStructure.js';
import Student from '../models/Student.js';

// @desc    Get all classes fee structures with aggregated student statistics
// @route   GET /api/fees/structure
// @access  Public (or Private)
export const getFeeStructures = async (req, res) => {
  try {
    const feeStructures = await FeeStructure.find({});

    // For each class fee structure, aggregate student counts
    const enrichedStructures = await Promise.all(
      feeStructures.map(async (structure) => {
        const students = await Student.find({ class: structure.class });
        const studentCount = students.length;
        
        let fullyPaidCount = 0;
        let pendingCount = 0;

        students.forEach((student) => {
          const total = student.totalFees - student.discount;
          const pendingAmount = total - student.paidFees;
          if (pendingAmount <= 0) {
            fullyPaidCount++;
          } else {
            pendingCount++;
          }
        });

        return {
          _id: structure._id,
          class: structure.class,
          fee: structure.fee,
          students: studentCount,
          paid: fullyPaidCount,
          pending: pendingCount
        };
      })
    );

    res.json(enrichedStructures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific class fee structure
// @route   GET /api/fees/structure/:class
// @access  Private
export const getFeeStructureByClass = async (req, res) => {
  try {
    const className = req.params.class;
    const structure = await FeeStructure.findOne({ class: className });
    if (structure) {
      res.json(structure);
    } else {
      res.status(404).json({ message: `Fee structure not set for ${className}` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update or Set fee structure for a class
// @route   PUT /api/fees/structure/:class
// @access  Private
export const updateFeeStructure = async (req, res) => {
  const { fee } = req.body;
  const className = req.params.class;

  try {
    let structure = await FeeStructure.findOne({ class: className });

    if (structure) {
      structure.fee = fee;
      const updatedStructure = await structure.save();
      res.json(updatedStructure);
    } else {
      // Create new structure if it doesn't exist
      structure = new FeeStructure({
        class: className,
        fee
      });
      const createdStructure = await structure.save();
      res.status(201).json(createdStructure);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get individual student fee records
// @route   GET /api/fees/records
// @access  Private
export const getStudentFeeRecords = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).sort({ name: 1 });

    const records = students.map((student) => {
      const total = student.totalFees - student.discount;
      const pending = total - student.paidFees;
      return {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        class: student.class,
        totalFee: student.totalFees,
        discount: student.discount,
        netFee: total,
        paid: student.paidFees,
        pending: pending > 0 ? pending : 0,
        // Since we don't track payment transactions in detail, we use createdAt or current date if paid
        lastPaymentDate: student.paidFees > 0 ? student.createdAt : null
      };
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
