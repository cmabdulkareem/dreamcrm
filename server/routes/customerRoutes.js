import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  addRemark,
  deleteCustomer,
  getConvertedCustomers
} from '../controller/customerController.js';
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// All routes require authentication
router.post('/create', verifyToken, createCustomer);
router.get('/all', verifyToken, getAllCustomers);
router.get('/converted', verifyToken, getConvertedCustomers);
router.get('/:id', verifyToken, getCustomerById);
router.put('/update/:id', verifyToken, updateCustomer);
router.post('/remark/:id', verifyToken, addRemark);
router.delete('/delete/:id', verifyToken, deleteCustomer);

export default router;