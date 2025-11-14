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

const router = Router();

// Public routes (no authentication required)
router.post('/create', createLeave);
router.get('/status/:ticketNumber', getLeaveByTicketNumber);

// Protected routes (require authentication)
// Note: Specific routes must come before parameterized routes
router.get('/', verifyToken, getAllLeaves);
router.put('/update/:id', verifyToken, updateLeave);
router.patch('/status/:id', verifyToken, updateLeaveStatus);
router.delete('/delete/:id', verifyToken, deleteLeave);
router.get('/:id', verifyToken, getLeaveById);

export default router;