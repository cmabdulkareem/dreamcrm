import express from 'express';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
} from '../controller/courseCategoryController.js';
import verifyToken from '../middleware/verifyToken.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// Public routes
router.get('/all', getAllCategories);

// Protected routes (admin only)
router.use(verifyToken);
router.use(applyBrandFilter);

router.post('/create', createCategory);
router.put('/update/:id', updateCategory);
router.delete('/delete/:id', deleteCategory);
router.patch('/toggle-status/:id', toggleCategoryStatus);

export default router;
