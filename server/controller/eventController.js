import eventModel from '../model/eventModel.js';
import eventRegistrationModel from '../model/eventRegistrationModel.js';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs';
import { hasAdminOrManagerOrCounsellorAccess } from '../utils/roleHelpers.js';

// Configure multer for banner uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the banners directory exists
const bannersDir = path.join(__dirname, "../uploads/banners");
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannersDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "banner-" + uuidv4() + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const bannerUpload = multer({ 
  storage: bannerStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware to handle single banner upload
export const uploadEventBannerMiddleware = bannerUpload.single("banner");

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await eventModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await eventModel.findById(id);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    return res.status(200).json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get event by registration link
export const getEventByLink = async (req, res) => {
  try {
    const { link } = req.params;
    const event = await eventModel.findOne({ registrationLink: link, isActive: true });
    
    if (!event) {
      return res.status(404).json({ message: "Event not found or inactive." });
    }

    return res.status(200).json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create new event
export const createEvent = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const {
      eventName,
      eventDescription,
      eventDate,
      registrationFields,
      maxRegistrations
    } = req.body;

    // Generate a unique registration link
    const registrationLink = crypto.randomBytes(16).toString('hex');

    const newEvent = new eventModel({
      eventName,
      eventDescription,
      eventDate: new Date(eventDate),
      registrationFields,
      registrationLink,
      maxRegistrations: parseInt(maxRegistrations) || 0
    });

    await newEvent.save();

    return res.status(201).json({ 
      message: "Event created successfully.", 
      event: newEvent 
    });
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const { id } = req.params;
    const updateData = req.body;

    const event = await eventModel.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key === 'eventDate') {
        event[key] = new Date(updateData[key]);
      } else if (key === 'maxRegistrations') {
        event[key] = parseInt(updateData[key]) || 0;
      } else if (key === 'isActive') {
        event[key] = updateData[key] === 'true' || updateData[key] === true;
      } else if (key !== '_id' && key !== '__v' && key !== 'registrationLink') {
        event[key] = updateData[key];
      }
    });

    await event.save();

    return res.status(200).json({ 
      message: "Event updated successfully.", 
      event 
    });
  } catch (error) {
    console.error("Update event error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const { id } = req.params;
    
    const event = await eventModel.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Also delete all registrations for this event
    await eventRegistrationModel.deleteMany({ eventId: id });

    return res.status(200).json({ message: "Event deleted successfully." });
  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Toggle event status
export const toggleEventStatus = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const { id } = req.params;
    
    const event = await eventModel.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    event.isActive = !event.isActive;
    await event.save();

    return res.status(200).json({ 
      message: `Event ${event.isActive ? 'activated' : 'deactivated'} successfully.`, 
      event 
    });
  } catch (error) {
    console.error("Toggle event status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Register for an event
export const registerForEvent = async (req, res) => {
  try {
    const { link } = req.params;
    const { registrantName, registrantEmail, registrationData } = req.body;

    // Find the event by link
    const event = await eventModel.findOne({ registrationLink: link, isActive: true });
    if (!event) {
      return res.status(404).json({ message: "Event not found or inactive." });
    }

    // Check if event has reached max registrations
    if (event.maxRegistrations > 0 && event.currentRegistrations >= event.maxRegistrations) {
      return res.status(400).json({ message: "Event registration is full." });
    }

    // Check if user already registered
    const existingRegistration = await eventRegistrationModel.findOne({
      eventId: event._id,
      registrantEmail: registrantEmail
    });

    if (existingRegistration) {
      return res.status(400).json({ message: "You have already registered for this event." });
    }

    // Validate required fields
    for (const field of event.registrationFields) {
      if (field.isRequired) {
        const submittedField = registrationData.find(data => data.fieldName === field.fieldName);
        if (!submittedField || !submittedField.fieldValue) {
          return res.status(400).json({ message: `Field ${field.fieldName} is required.` });
        }
      }
    }

    // Create registration
    const newRegistration = new eventRegistrationModel({
      eventId: event._id,
      registrantName,
      registrantEmail,
      registrationData
    });

    await newRegistration.save();

    // Increment registration count
    event.currentRegistrations += 1;
    await event.save();

    return res.status(201).json({ 
      message: "Registration successful.", 
      registration: newRegistration 
    });
  } catch (error) {
    console.error("Event registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all registrations for an event
export const getEventRegistrations = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const { id } = req.params;
    
    // Check if event exists
    const event = await eventModel.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const registrations = await eventRegistrationModel.find({ eventId: id }).sort({ createdAt: -1 });

    return res.status(200).json({ registrations });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Upload event banner
export const uploadEventBanner = async (req, res) => {
  try {
    // Check if user has admin, manager, or counselor access
    if (!hasAdminOrManagerOrCounsellorAccess(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin, Manager, or Counselor privileges required." });
    }

    const { id } = req.params;
    
    // Check if event exists
    const event = await eventModel.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Compress the image using sharp
    const compressedFileName = `compressed-${req.file.filename}`;
    const compressedFilePath = path.join(bannersDir, compressedFileName);
    
    await sharp(req.file.path)
      .resize(1280, 720, { fit: 'inside', withoutEnlargement: true }) // Resize to max 1280x720 (16:9)
      .jpeg({ quality: 80 }) // Compress to 80% quality
      .toFile(compressedFilePath);
    
    // Remove the original uncompressed file
    fs.unlinkSync(req.file.path);

    // Save the compressed file path in the database (relative path for web access)
    const bannerImageUrl = `/uploads/banners/${compressedFileName}`;
    
    event.bannerImage = bannerImageUrl;
    await event.save();

    return res.status(200).json({ 
      message: "Banner uploaded successfully.", 
      bannerImage: bannerImageUrl 
    });
  } catch (error) {
    console.error("Error uploading event banner:", error);
    
    // Clean up any uploaded files if there was an error
    if (req.file) {
      const filePath = req.file.path;
      const compressedFilePath = path.join(bannersDir, `compressed-${req.file.filename}`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      if (fs.existsSync(compressedFilePath)) {
        fs.unlinkSync(compressedFilePath);
      }
    }
    
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  getAllEvents,
  getEventById,
  getEventByLink,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventStatus,
  registerForEvent,
  getEventRegistrations,
  uploadEventBanner,
  uploadEventBannerMiddleware
};
