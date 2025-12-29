import express from "express";
import {
  getMonthlyTargets,
  getTargetByMonth,
  setMonthlyTarget,
  deleteMonthlyTarget
} from '../controller/monthlyTargetController.js';
import verifyToken from "../middleware/verifyToken.js";
import { applyBrandFilter } from "../middleware/brandMiddleware.js";

const router = express.Router();

// All routes require authentication and brand filter
router.use(verifyToken);
router.use(applyBrandFilter);

// Get monthly targets for current month and upcoming 3 months
router.get('/all', getMonthlyTargets);

// Get target for a specific month
router.get('/:year/:month', getTargetByMonth);

// Create or update monthly target (Owner and Admin only)
router.post('/set', setMonthlyTarget);

// Delete monthly target (Owner and Admin only)
router.delete('/:id', deleteMonthlyTarget);

export default router;

