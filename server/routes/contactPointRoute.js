import express from 'express';
import {
  getAllContactPoints,
  getActiveContactPoints,
  createContactPoint,
  updateContactPoint,
  deleteContactPoint
} from '../controller/contactPointController.js';
import verifyToken from '../middleware/verifyToken.js';

import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(applyBrandFilter);

// Get all contact points (for admin/settings page)
router.get('/all', getAllContactPoints);

// Get active contact points only (for dropdowns)
router.get('/active', getActiveContactPoints);

// Create new contact point
router.post('/create', createContactPoint);

// Update contact point
router.put('/update/:id', updateContactPoint);

// Delete contact point
router.delete('/delete/:id', deleteContactPoint);

export default router;