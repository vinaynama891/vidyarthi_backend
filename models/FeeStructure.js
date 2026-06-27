import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true,
    unique: true
  },
  fee: {
    type: Number,
    required: true
  }
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;
