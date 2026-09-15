import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js DNS resolution order to IPv4 first (prevents Windows IPv6 timeout on MongoDB Atlas)
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vidyarthi', {
      family: 4
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
