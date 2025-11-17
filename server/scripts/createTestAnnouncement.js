import mongoose from 'mongoose';
import Announcement from '../model/announcementModel.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create a test announcement
const createTestAnnouncement = async () => {
  try {
    // Create announcement with immediate start and end times
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const announcement = new Announcement({
      title: 'Test Announcement',
      message: 'This is a test announcement to verify the announcement system is working correctly.',
      startTime: now,
      endTime: endTime,
      createdBy: '60f0b0f0f0f0f0f0f0f0f0f0', // Placeholder user ID
      status: 'approved'
    });

    const savedAnnouncement = await announcement.save();
    console.log('Test announcement created:', savedAnnouncement);
  } catch (error) {
    console.error('Error creating test announcement:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await createTestAnnouncement();
  mongoose.connection.close();
};

run();