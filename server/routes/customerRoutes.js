import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  addRemark,
  deleteCustomer,
  getConvertedCustomers,
  assignLead,
  markRemarkAsRead,
  getAllLeadsCount,
  getBrandConversionMetrics,
  getAllCustomersUnfiltered,
  getLeaderboard,
  importLeads,
  checkPhoneUniqueness
} from '../controller/customerController.js';
import verifyToken from "../middleware/verifyToken.js";
import { applyBrandFilter } from "../middleware/brandMiddleware.js";

const router = express.Router();

// All routes require authentication and brand filter
router.use(verifyToken);
router.use(applyBrandFilter);

router.get('/check-phone', checkPhoneUniqueness);
router.post('/create', createCustomer);
router.get('/all', getAllCustomers);
router.get('/all-unfiltered', getAllCustomersUnfiltered);
router.get('/converted', getConvertedCustomers);
router.get('/all-leads-count', getAllLeadsCount);
router.get('/brand-conversion-metrics', getBrandConversionMetrics);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getCustomerById);
router.put('/update/:id', updateCustomer);
router.post('/remark/:id', addRemark);
router.post('/import-leads', importLeads);
router.delete('/delete/:id', deleteCustomer);
// New routes for lead assignment
router.put('/assign/:id', assignLead);
router.put('/mark-remark-read/:id/:remarkIndex', markRemarkAsRead);

export default router;