import express from 'express';
import { getTasks, createTask, updateTask, deleteTask, addRemark, toggleSubTask, addSubTask, deleteSubTask, updateSubTask } from '../controller/marketingTaskController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/remarks', addRemark);
router.patch('/:id/subtasks/:subTaskId/toggle', toggleSubTask);
router.post('/:id/subtasks', addSubTask);
router.patch('/:id/subtasks/:subTaskId', updateSubTask);
router.delete('/:id/subtasks/:subTaskId', deleteSubTask);

export default router;
