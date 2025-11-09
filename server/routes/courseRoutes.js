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

const router = express.Router();

// Public routes
router.get('/all', getAllCourses);
router.get('/:id', getCourseById);

// Protected routes (admin only)
router.post('/create', verifyToken, createCourse);
router.put('/update/:id', verifyToken, updateCourse);
router.delete('/delete/:id', verifyToken, deleteCourse);
router.patch('/toggle-status/:id', verifyToken, toggleCourseStatus);

export default router;