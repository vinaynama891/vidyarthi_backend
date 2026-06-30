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

        // Resolve effective fees: prefer new fields, fall back to legacy `fee`
        const engFee = structure.englishMediumFee || structure.fee || 0;
        const hindiFee = structure.hindiMediumFee || 0;

        return {
          _id: structure._id,
          class: structure.class,
          fee: engFee,                    // legacy compat
          englishMediumFee: engFee,
          hindiMediumFee: hindiFee,
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
      const engFee = structure.englishMediumFee || structure.fee || 0;
      const hindiFee = structure.hindiMediumFee || 0;
      res.json({
        _id: structure._id,
        class: structure.class,
        fee: engFee,
        englishMediumFee: engFee,
        hindiMediumFee: hindiFee
      });
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
  const { fee, englishMediumFee, hindiMediumFee } = req.body;
  const className = req.params.class;

  // Determine english fee: prefer explicit englishMediumFee, else legacy fee field
  const engFee = englishMediumFee !== undefined ? parseFloat(englishMediumFee) : (fee !== undefined ? parseFloat(fee) : undefined);
  const hindiFee = hindiMediumFee !== undefined ? parseFloat(hindiMediumFee) : undefined;

  try {
    let structure = await FeeStructure.findOne({ class: className });

    if (structure) {
      if (engFee !== undefined) {
        structure.englishMediumFee = engFee;
        structure.fee = engFee; // keep legacy in sync
      }
      if (hindiFee !== undefined) {
        structure.hindiMediumFee = hindiFee;
      }
      const updatedStructure = await structure.save();
      res.json(updatedStructure);
    } else {
      // Create new structure if it doesn't exist
      structure = new FeeStructure({
        class: className,
        fee: engFee || 0,
        englishMediumFee: engFee || 0,
        hindiMediumFee: hindiFee || 0
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
        medium: student.medium || 'English',
        totalFee: student.totalFees,
        discount: student.discount,
        netFee: total,
        paid: student.paidFees,
        pending: pending > 0 ? pending : 0,
        lastPaymentDate: student.paidFees > 0 ? student.createdAt : null
      };
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
