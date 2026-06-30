import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true,
    unique: true
  },
  // Legacy field kept for backward compatibility
  fee: {
    type: Number,
    default: 0
  },
  englishMediumFee: {
    type: Number,
    default: 0
  },
  hindiMediumFee: {
    type: Number,
    default: 0
  }
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;
