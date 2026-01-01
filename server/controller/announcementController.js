import Announcement from '../model/announcementModel.js';
import User from '../model/userModel.js';

// Create a new announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, startTime, endTime } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!title || !message || !startTime || !endTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check if user has manager role (auto-approve)
    const user = await User.findById(userId);
    const isAdmin = user.isAdmin;
    const userRoles = user.roles || [];
    const isManager = isAdmin || userRoles.includes('Owner') || userRoles.includes('Admin') ||
      userRoles.includes('Center Head / Manager') || userRoles.includes('Manager');

    // Create announcement
    const announcement = new Announcement({
      title,
      message,
      startTime: start,
      endTime: end,
      createdBy: userId,
      status: isManager ? 'approved' : 'pending',
      brand: null // Common to all brands
    });

    const savedAnnouncement = await announcement.save();

    // Populate createdBy field
    await savedAnnouncement.populate('createdBy', 'fullName email');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: savedAnnouncement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all announcements (managers see all, others see approved only)
export const getAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Check if user has manager role
    const isAdmin = user.isAdmin;
    const userRoles = user.roles || [];
    const isManager = isAdmin || userRoles.includes('Owner') || userRoles.includes('Admin') ||
      userRoles.includes('Center Head / Manager') || userRoles.includes('Manager');

    // Query based on user role
    // Query based on user role and brand filter
    const query = isManager ? {} : { status: 'approved' };

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Announcements fetched successfully',
      announcements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve an announcement (manager only)
export const approveAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user has manager role
    const user = await User.findById(userId);
    const isAdmin = user.isAdmin;
    const userRoles = user.roles || [];
    const isManager = isAdmin || userRoles.includes('Owner') || userRoles.includes('Admin') ||
      userRoles.includes('Center Head / Manager') || userRoles.includes('Manager');

    if (!isManager) {
      return res.status(403).json({ message: 'Access denied. Managers only.' });
    }

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    ).populate('createdBy', 'fullName');

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json({
      message: 'Announcement approved successfully',
      announcement
    });
  } catch (error) {
    console.error('Error approving announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject/delete an announcement (manager only)
export const rejectAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user has manager role
    const user = await User.findById(userId);
    const isAdmin = user.isAdmin;
    const userRoles = user.roles || [];
    const isManager = isAdmin || userRoles.includes('Owner') || userRoles.includes('Admin') ||
      userRoles.includes('Center Head / Manager') || userRoles.includes('Manager');

    if (!isManager) {
      return res.status(403).json({ message: 'Access denied. Managers only.' });
    }

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json({
      message: 'Announcement rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update an announcement (manager only)
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, startTime, endTime, status } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!title || !message || !startTime || !endTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check if user has manager role
    const user = await User.findById(userId);
    const isAdmin = user.isAdmin;
    const userRoles = user.roles || [];
    const isManager = isAdmin || userRoles.includes('Owner') || userRoles.includes('Admin') ||
      userRoles.includes('Center Head / Manager') || userRoles.includes('Manager');

    if (!isManager) {
      return res.status(403).json({ message: 'Access denied. Managers only.' });
    }

    // Find and update the announcement
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        title,
        message,
        startTime: start,
        endTime: end,
        status: status || 'pending' // Keep existing status if not provided
      },
      { new: true }
    ).populate('createdBy', 'fullName');

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json({
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get active announcements for header display
export const getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date();

    const announcements = await Announcement.find({
      status: 'approved',
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Active announcements fetched successfully',
      announcements
    });
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
