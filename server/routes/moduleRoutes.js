import express from 'express';
import {
  getAllModules,
  reorderModules,
  createModule,
  updateModule,
  deleteModule,
  toggleModuleStatus
} from '../controller/moduleController.js';
import verifyToken from '../middleware/verifyToken.js';
import { requireManager } from '../middleware/roleMiddleware.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// Public routes
router.get('/all', getAllModules);

// Protected routes (admin/manager only)
router.use(verifyToken);
router.use(applyBrandFilter);

router.post('/create', requireManager, createModule);
router.patch('/reorder', requireManager, reorderModules);
router.put('/update/:id', requireManager, updateModule);
router.delete('/delete/:id', requireManager, deleteModule);
router.patch('/toggle-status/:id', requireManager, toggleModuleStatus);

export default router;
