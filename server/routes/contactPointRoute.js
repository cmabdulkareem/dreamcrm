import express from 'express';
import {
  getAllContactPoints,
  getActiveContactPoints,
  createContactPoint,
  updateContactPoint,
  deleteContactPoint
} from '../controller/contactPointController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Get all contact points (for admin/settings page)
router.get('/all', verifyToken, getAllContactPoints);

// Get active contact points only (for dropdowns)
router.get('/active', verifyToken, getActiveContactPoints);

// Create new contact point
router.post('/create', verifyToken, createContactPoint);

// Update contact point
router.put('/update/:id', verifyToken, updateContactPoint);

// Delete contact point
router.delete('/delete/:id', verifyToken, deleteContactPoint);

export default router;