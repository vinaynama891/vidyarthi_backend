import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const testDb = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vidyarthi';
    console.log('Connecting to Mongo URI:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    // Fetch the 5 most recently created students
    const students = await Student.find({}).sort({ createdAt: -1 }).limit(5);
    
    if (students.length === 0) {
      console.log('No students found in the database.');
    } else {
      console.log('\n--- Recently Registered Students ---');
      for (const student of students) {
        console.log(`\nName: ${student.name}`);
        console.log(`Student ID: ${student.studentId}`);
        console.log(`Phone: ${student.phone}`);
        console.log(`Type: ${student.studentType}`);
        console.log(`Password Hash: ${student.password}`);
        
        // Test standard password
        const isMatch = await student.matchPassword('Vidyarthi@20');
        console.log(`Password 'Vidyarthi@20' matches? ${isMatch ? 'YES' : 'NO'}`);
      }
    }
  } catch (err) {
    console.error('Error during DB inspection:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed.');
  }
};

testDb();
