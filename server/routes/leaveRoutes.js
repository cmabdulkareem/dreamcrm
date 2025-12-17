import { Router } from 'express';
import {
  getAllLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  updateLeaveStatus,
  getLeaveByTicketNumber
} from '../controller/leaveController.js';
import verifyToken from '../middleware/verifyToken.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = Router();

// Public routes (no authentication required)
router.get('/status/:ticketNumber', getLeaveByTicketNumber);

// Protected routes (require authentication)
router.use(verifyToken);
router.use(applyBrandFilter); // Apply brand filter to protected routes

// Note: Specific routes must come before parameterized routes
router.post('/create', createLeave); // Moved to protected routes
router.get('/', getAllLeaves);
router.put('/update/:id', updateLeave);
router.patch('/status/:id', updateLeaveStatus);
router.delete('/delete/:id', deleteLeave);
router.get('/:id', getLeaveById);

export default router;