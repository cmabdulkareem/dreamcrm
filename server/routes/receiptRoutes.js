import express from 'express';
import { createReceipt, getReceiptsByInvoice, getReceipt } from '../controller/receiptController.js';
import verifyToken from '../middleware/verifyToken.js';
import { hasAnyRole } from '../utils/roleHelpers.js';

const router = express.Router();

const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !hasAnyRole(req.user, allowedRoles)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }
        next();
    };
};

import { applyBrandFilter } from '../middleware/brandMiddleware.js';

// Apply auth middleware to all routes
router.use(verifyToken);
router.use(applyBrandFilter);
router.use(restrictTo('Accountant', 'Manager', 'Brand Manager', 'Admin', 'Super Admin', 'Owner'));

router.post('/', createReceipt);
router.get('/invoice/:invoiceId', getReceiptsByInvoice);
router.get('/:id', getReceipt);

export default router;
