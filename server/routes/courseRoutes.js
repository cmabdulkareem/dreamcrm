import express from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleCourseStatus
} from '../controller/courseController.js';
import verifyToken from '../middleware/verifyToken.js';
import { requireManager } from '../middleware/roleMiddleware.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// Public routes
router.get('/all', getAllCourses);
router.get('/:id', getCourseById);

// Protected routes (admin only)
// Protected routes (admin only) - Apply Brand Filter
router.use(verifyToken);
router.use(applyBrandFilter);

router.post('/create', requireManager, createCourse);
router.put('/update/:id', requireManager, updateCourse);
router.delete('/delete/:id', requireManager, deleteCourse);
router.patch('/toggle-status/:id', requireManager, toggleCourseStatus);

export default router;