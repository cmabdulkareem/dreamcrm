import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import {
    getSchools,
    createSchool,
    updateSchool,
    deleteSchool,
    getStreams,
    createStream,
    deleteStream,
    getClasses,
    createClass,
    deleteClass,
    getStudents,
    createStudent,
    deleteStudent
} from '../controller/prospectDatabaseController.js';

const router = express.Router();

router.use(verifyToken);

// Schools
router.get('/schools', getSchools);
router.post('/schools', createSchool);
router.put('/schools/:id', updateSchool);
router.delete('/schools/:id', deleteSchool);

// Streams
router.get('/schools/:schoolId/streams', getStreams);
router.post('/schools/:schoolId/streams', createStream);
router.delete('/streams/:id', deleteStream);

// Classes
router.get('/streams/:streamId/classes', getClasses);
router.post('/streams/:streamId/classes', createClass);
router.delete('/classes/:id', deleteClass);

// Students
router.get('/classes/:classId/students', getStudents);
router.post('/classes/:classId/students', createStudent);
router.delete('/students/:id', deleteStudent);

export default router;
