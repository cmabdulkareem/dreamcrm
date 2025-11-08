import express from 'express';
import {
  getAllCampaigns,
  getActiveCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign
} from '../controller/campaignController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Get all campaigns (for admin/settings page)
router.get('/all', verifyToken, getAllCampaigns);

// Get active campaigns only (for dropdowns)
router.get('/active', verifyToken, getActiveCampaigns);

// Create new campaign
router.post('/create', verifyToken, createCampaign);

// Update campaign
router.put('/update/:id', verifyToken, updateCampaign);

// Delete campaign
router.delete('/delete/:id', verifyToken, deleteCampaign);

export default router;
