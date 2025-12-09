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
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// Public routes
router.get('/all', getAllCourses);
router.get('/:id', getCourseById);

// Protected routes (admin only)
// Protected routes (admin only) - Apply Brand Filter
router.use(verifyToken);
router.use(applyBrandFilter);

router.post('/create', createCourse);
router.put('/update/:id', updateCourse);
router.delete('/delete/:id', deleteCourse);
router.patch('/toggle-status/:id', toggleCourseStatus);

export default router;