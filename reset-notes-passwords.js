import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const resetPasswords = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vidyarthi';
    console.log('Connecting to Mongo...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const notesStudents = await Student.find({ studentType: 'NotesOnly' });
    console.log(`Found ${notesStudents.length} NotesOnly students.`);

    for (const student of notesStudents) {
      student.password = 'Vidyarthi@20';
      // Calling .save() executes the pre('save') middleware to correctly bcrypt hash it
      await student.save();
      console.log(`Updated password to 'Vidyarthi@20' for: ${student.name} (ID: ${student.studentId})`);
    }
  } catch (err) {
    console.error('Error during password update:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

resetPasswords();
