import express from 'express';
import {
    getAllBatches,
    createBatch,
    updateBatch,
    deleteBatch,
    getBatchStudents,
    addStudentToBatch,
    updateBatchStudent,
    removeStudentFromBatch,
    markAttendance,
    getAttendance
} from '../controller/batchController.js';
import verifyToken from '../middleware/verifyToken.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// All batch routes are protected
router.use(verifyToken);
router.use(applyBrandFilter);

// Batch operations
router.get('/', getAllBatches);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

// Student in batch operations
router.get('/:id/students', getBatchStudents);
router.post('/:id/students', addStudentToBatch);
router.put('/students/:studentId', updateBatchStudent);
router.delete('/students/:studentId', removeStudentFromBatch);

// Attendance operations
router.post('/:id/attendance', markAttendance);
router.get('/:id/attendance', getAttendance);

export default router;
