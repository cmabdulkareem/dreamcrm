import express from "express";
import {
  uploadStudentPhoto,
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getNextStudentId
} from '../controller/studentController.js';
import verifyToken from "../middleware/verifyToken.js";
import { applyBrandFilter } from "../middleware/brandMiddleware.js";

const router = express.Router();

// All routes require authentication and brand filter
router.use(verifyToken);
router.use(applyBrandFilter);

router.get('/all', verifyToken, getAllStudents);
router.get('/get-next-id', verifyToken, getNextStudentId);
router.get('/:id', verifyToken, getStudentById);
router.put('/update/:id', verifyToken, updateStudent);
router.delete('/delete/:id', verifyToken, deleteStudent);

export default router;