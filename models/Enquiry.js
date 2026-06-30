import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Enquiry title/subject is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Enquiry details are required'],
      trim: true
    },
    adminNote: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Enquiry = mongoose.model('Enquiry', enquirySchema);

export default Enquiry;
