import express from 'express';
import {
  getAllCampaigns,
  getActiveCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign
} from '../controller/campaignController.js';
import verifyToken from '../middleware/verifyToken.js';
import { requireManager } from '../middleware/roleMiddleware.js';

import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// Apply authentication and brand filter to all routes
router.use(verifyToken);
router.use(applyBrandFilter);

// Get all campaigns (for admin/settings page)
router.get('/all', getAllCampaigns);

// Get active campaigns only (for dropdowns)
router.get('/active', getActiveCampaigns);

// Create new campaign
router.post('/create', requireManager, createCampaign);

// Update campaign
router.put('/update/:id', requireManager, updateCampaign);

// Delete campaign
router.delete('/delete/:id', requireManager, deleteCampaign);

export default router;
