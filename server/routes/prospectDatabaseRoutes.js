import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import {
    getFolders,
    createFolder,
    updateFolder,
    deleteFolder,
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
    deleteStudent,
    bulkCreateStudents
} from '../controller/prospectDatabaseController.js';

const router = express.Router();

router.use(verifyToken);

// Folders
router.get('/folders', getFolders);
router.post('/folders', createFolder);
router.put('/folders/:id', updateFolder);
router.delete('/folders/:id', deleteFolder);

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
router.post('/classes/:classId/students/bulk', bulkCreateStudents);
router.delete('/students/:id', deleteStudent);

export default router;
