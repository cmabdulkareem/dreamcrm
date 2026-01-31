import express from 'express';
import { getHolidays, addHoliday, deleteHoliday } from '../controller/holidayController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getHolidays);
router.post('/', addHoliday);
router.delete('/:id', deleteHoliday);

export default router;
