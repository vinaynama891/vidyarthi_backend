import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import testResultRoutes from './routes/testResultRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import studyMaterialRoutes from './routes/studyMaterialRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import demoClassRoutes from './routes/demoClassRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import coursePageRoutes from './routes/coursePageRoutes.js';

// Model imports for seeding
import Admin from './models/Admin.js';
import FeeStructure from './models/FeeStructure.js';
import Achievement from './models/Achievement.js';
import Student from './models/Student.js';
import Teacher from './models/Teacher.js';

dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory');
}

// Serve static upload files
app.use('/uploads', express.static(uploadsDir));

// Route Mountings
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/results', testResultRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/demo-classes', demoClassRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/courses', coursePageRoutes);

// Test API
app.get('/', (req, res) => {
  res.send('Vidyarthi Classes Kota API is running...');
});

// Database Seed function
const seedDatabase = async () => {
  try {
    // 1. Seed Admin
    const adminCount = await Admin.countDocuments({});
    if (adminCount === 0) {
      const admin = new Admin({
        name: 'Vidyarthi Admin',
        email: 'admin@vidyarthi.com',
        password: 'admin123'
      });
      await admin.save();
      console.log('Database Seeded: Created Default Admin Account:');
      console.log('  Email: admin@vidyarthi.com');
      console.log('  Password: admin123');
    }

    // 2. Seed Fee Structure
    const feeCount = await FeeStructure.countDocuments({});
    if (feeCount === 0) {
      const defaultFees = [
        { class: 'Class 1', fee: 5000 },
        { class: 'Class 2', fee: 5000 },
        { class: 'Class 3', fee: 6000 },
        { class: 'Class 4', fee: 6000 },
        { class: 'Class 5', fee: 7000 },
        { class: 'Class 6', fee: 7000 },
        { class: 'Class 7', fee: 8000 },
        { class: 'Class 8', fee: 8000 },
        { class: 'Class 9', fee: 9000 },
        { class: 'Class 10', fee: 10000 },
        { class: 'Class 11', fee: 12000 },
        { class: 'Class 12', fee: 12000 },
        { class: 'BSTC', fee: 8000 },
        { class: 'Rajasthan GK', fee: 4000 },
        { class: 'Hindi Literature', fee: 6000 }
      ];
      await FeeStructure.insertMany(defaultFees);
      console.log('Database Seeded: Fee structures created for all classes.');
    }

    // Seeding of Default and Mock Teachers has been removed permanently.

    // 3. Seed some mock Achievements if empty (using placeholder illustrations or simple colors)
    const achCount = await Achievement.countDocuments({});
    if (achCount === 0) {
      const sampleAchievements = [
        {
          studentName: 'Aarav Sharma',
          fatherName: 'Rajesh Sharma',
          class: 'Class 12',
          description: 'Scored 98.4% in CBSE Board Exams, District Topper.',
          photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
          order: 0
        },
        {
          studentName: 'Priya Patel',
          fatherName: 'Vikram Patel',
          class: 'BSTC',
          description: 'Secured Rank 3 in Rajasthan BSTC Entrance Exam.',
          photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          order: 1
        },
        {
          studentName: 'Kabir Singh',
          fatherName: 'Manpreet Singh',
          class: 'Rajasthan GK',
          description: 'Rajasthan GK state quiz winner, full marks scorer.',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
          order: 2
        }
      ];
      await Achievement.insertMany(sampleAchievements);
      console.log('Database Seeded: Added initial sample achievements.');
    }

    // 4. Seed some mock students/teachers if empty, to give immediate value to Dashboard
    const studentCount = await Student.countDocuments({});
    if (studentCount === 0) {
      const mockStudent = new Student({
        studentId: 'VK5A1',
        name: 'Rohan Meena',
        fatherName: 'Harish Meena',
        class: 'Class 10',
        phone: '9876543210',
        goodiesStatus: 'Bag & Books',
        totalFees: 10000,
        paidFees: 7000,
        discount: 1000,
        address: '123, Talwandi, Kota'
      });
      await mockStudent.save();

      const mockStudent2 = new Student({
        studentId: 'VK5A2',
        name: 'Anjali Sharma',
        fatherName: 'Kailash Sharma',
        class: 'BSTC',
        phone: '9123456789',
        goodiesStatus: 'Pending',
        totalFees: 8000,
        paidFees: 8000,
        discount: 0,
        address: '45-B, Vigyan Nagar, Kota'
      });
      await mockStudent2.save();
    }
  } catch (error) {
    console.error('Seeding database failed:', error);
  }
};

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  await connectDB();
  await seedDatabase();
});
