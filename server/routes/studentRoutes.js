import express from "express";
import {
  uploadStudentPhoto,
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} from '../controller/studentController.js';
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// All routes require authentication
router.post('/create', verifyToken, uploadStudentPhoto, createStudent);
router.get('/all', verifyToken, getAllStudents);
router.get('/:id', verifyToken, getStudentById);
router.put('/update/:id', verifyToken, updateStudent);
router.delete('/delete/:id', verifyToken, deleteStudent);

export default router;