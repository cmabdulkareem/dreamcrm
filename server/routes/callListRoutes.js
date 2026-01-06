import express from 'express';
import {
    getAllCallLists,
    createCallList,
    updateCallList,
    deleteCallList,
    importCallLists,
    updateCallListStatus
} from '../controller/callListController.js';
import verifyToken from '../middleware/verifyToken.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// All call list routes are protected and brand-scoped
router.use(verifyToken);
router.use(applyBrandFilter);

// Call list operations
router.get('/', getAllCallLists);
router.post('/', createCallList);
router.put('/:id', updateCallList);
router.delete('/:id', deleteCallList); // Owner check is in controller
router.post('/import', importCallLists);
router.patch('/:id/status', updateCallListStatus);

export default router;
