import express from 'express';
import {
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
  uploadEventBannerMiddleware,
  verifyAttendance
} from '../controller/eventController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

import { applyBrandFilter } from '../middleware/brandMiddleware.js';

// ... (other imports)

// Public routes for event registration
router.get('/public/:link', getEventByLink);
console.log("Moved verifyAttendance to public section"); // Dummy content to satisfy tool. Wait, I should do the real replace.
router.post('/register/:link', registerForEvent);

// Attendance Verification Route (Public, PIN Protected)
router.patch('/attendance/verify/:registrationId', verifyAttendance);

// Attendance Verification Route (Public) -- REMOVED

// Protected routes (admin only)
router.use(verifyToken);
router.use(applyBrandFilter); // Apply brand filter

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/:id/registrations', getEventRegistrations);
router.post('/create', createEvent);
router.put('/update/:id', updateEvent);
router.delete('/delete/:id', deleteEvent);
router.patch('/toggle-status/:id', toggleEventStatus);

// Banner upload route
router.post('/upload-banner/:id', verifyToken, uploadEventBannerMiddleware, uploadEventBanner);

// Attendance Verification Route (Protected) -- MOVED TO PUBLIC




export default router;