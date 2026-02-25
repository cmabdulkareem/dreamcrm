import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';
import {
    uploadPromotional,
    getPromotionals,
    deletePromotional
} from '../controller/promotionalController.js';
import { requireManager } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(applyBrandFilter);

router.post('/upload', requireManager, uploadPromotional);
router.get('/', getPromotionals);
router.delete('/:id', requireManager, deletePromotional);

export default router;
