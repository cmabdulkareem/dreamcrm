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
router.get('/all', verifyToken, getAllCustomers);
router.get('/all-unfiltered', verifyToken, getAllCustomersUnfiltered);
router.get('/converted', verifyToken, getConvertedCustomers);
router.get('/all-leads-count', verifyToken, getAllLeadsCount);
router.get('/brand-conversion-metrics', verifyToken, getBrandConversionMetrics);
router.get('/leaderboard', verifyToken, getLeaderboard);
router.get('/:id', verifyToken, getCustomerById);
router.put('/update/:id', verifyToken, updateCustomer);
router.post('/remark/:id', verifyToken, addRemark);
router.post('/import-leads', verifyToken, importLeads);
router.delete('/delete/:id', verifyToken, deleteCustomer);
// New routes for lead assignment
router.put('/assign/:id', verifyToken, assignLead);
router.put('/mark-remark-read/:id/:remarkIndex', verifyToken, markRemarkAsRead);

export default router;