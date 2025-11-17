import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  approveAnnouncement,
  rejectAnnouncement,
  updateAnnouncement,
  getActiveAnnouncements
} from '../controller/announcementController.js';
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Public route to get active announcements for header display
router.get('/active', getActiveAnnouncements);

// Test route to create a test announcement (for debugging)
router.post('/create-test', async (req, res) => {
  try {
    // Import Announcement model directly
    const Announcement = (await import('../model/announcementModel.js')).default;
    
    // Create announcement with immediate start and end times
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const announcement = new Announcement({
      title: 'Test Breaking News',
      message: 'This is a test breaking news announcement for the header ticker.',
      startTime: now,
      endTime: endTime,
      createdBy: '60f0b0f0f0f0f0f0f0f0f0f0', // Placeholder user ID
      status: 'approved'
    });

    const savedAnnouncement = await announcement.save();
    console.log('Test announcement created:', savedAnnouncement);

    res.status(201).json({
      message: 'Test announcement created successfully',
      announcement: savedAnnouncement
    });
  } catch (error) {
    console.error('Error creating test announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Log all requests to announcement routes
router.use((req, res, next) => {
  console.log(`Announcement route hit: ${req.method} ${req.originalUrl}`);
  next();
});

// Test route to check if routes are working
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Announcement routes are working' });
});

// Protected routes (require authentication)
router.post('/create', verifyToken, createAnnouncement);
router.get('/all', verifyToken, getAnnouncements);
router.put('/:id', verifyToken, updateAnnouncement);
router.patch('/:id/approve', verifyToken, approveAnnouncement);
router.delete('/:id', verifyToken, rejectAnnouncement);

export default router;