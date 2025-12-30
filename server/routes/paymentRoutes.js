import express from 'express';
import {
    createPayment,
    getAllPayments,
    getPaymentStats
} from '../controller/paymentController.js';
import verifyToken from '../middleware/verifyToken.js';
import { applyBrandFilter } from '../middleware/brandMiddleware.js';

const router = express.Router();

// Apply global middleware for this router
router.use(verifyToken);
router.use(applyBrandFilter);

// Define Routes
router.post('/create', createPayment);
router.get('/all', getAllPayments);
router.get('/stats/monthly-revenue', getPaymentStats);

export default router;
