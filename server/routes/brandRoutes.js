import express from "express";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  assignBrandsToUser,
  getUserBrands
} from '../controller/brandController.js';
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Brand management routes (admin only)
router.post('/', verifyToken, createBrand);
router.get('/', verifyToken, getAllBrands);
router.get('/:id', verifyToken, getBrandById);
router.put('/:id', verifyToken, updateBrand);
router.delete('/:id', verifyToken, deleteBrand);

// Brand assignment routes (admin only)
router.post('/assign', verifyToken, assignBrandsToUser);
router.get('/user/:userId', verifyToken, getUserBrands);

export default router;