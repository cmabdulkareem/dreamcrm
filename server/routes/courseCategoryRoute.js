import express from 'express';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
} from '../controller/courseCategoryController.js';
import verifyToken from '../middleware/verifyToken.js';
import { requireManager } from '../middleware/roleMiddleware.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// Public routes
router.get('/all', getAllCategories);

// Protected routes (admin only)
router.use(verifyToken);
router.use(applyBrandFilter);

router.post('/create', requireManager, createCategory);
router.put('/update/:id', requireManager, updateCategory);
router.delete('/delete/:id', requireManager, deleteCategory);
router.patch('/toggle-status/:id', requireManager, toggleCategoryStatus);

export default router;
