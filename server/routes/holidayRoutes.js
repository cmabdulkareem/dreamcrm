import express from 'express';
import { getHolidays, addHoliday, deleteHoliday } from '../controller/holidayController.js';
import verifyToken from '../middleware/verifyToken.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(applyBrandFilter);

router.get('/', getHolidays);
router.post('/', addHoliday);
router.delete('/:id', deleteHoliday);

export default router;
