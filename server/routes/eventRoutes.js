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
  uploadEventBannerMiddleware
} from '../controller/eventController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Public routes for event registration
router.get('/public/:link', getEventByLink);
router.post('/register/:link', registerForEvent);

// Protected routes (admin only)
router.get('/', verifyToken, getAllEvents);
router.get('/:id', verifyToken, getEventById);
router.get('/:id/registrations', verifyToken, getEventRegistrations);
router.post('/create', verifyToken, createEvent);
router.put('/update/:id', verifyToken, updateEvent);
router.delete('/delete/:id', verifyToken, deleteEvent);
router.patch('/toggle-status/:id', verifyToken, toggleEventStatus);

// Banner upload route
router.post('/upload-banner/:id', verifyToken, uploadEventBannerMiddleware, uploadEventBanner);

export default router;