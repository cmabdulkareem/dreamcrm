import express from 'express';
import {
    createSupportRequest,
    getAllSupportRequests,
    updateSupportStatus,
    addSupportResponse,
    toggleUpvote
} from '../controller/supportController.js';
import verifyToken from '../middleware/verifyToken.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(applyBrandFilter);

router.post('/', createSupportRequest);
router.get('/', getAllSupportRequests);
router.patch('/:id/status', updateSupportStatus);
router.post('/:id/responses', addSupportResponse);
router.post('/:id/upvote', toggleUpvote);

export default router;
