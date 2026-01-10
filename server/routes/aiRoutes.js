import express from "express";
import { getLeadAnalysis } from "../controller/aiController.js";
// Assuming there's a middleware to protect routes
// import { protect } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// router.get("/analyze-lead/:id", protect, getLeadAnalysis);
router.get("/analyze-lead/:id", getLeadAnalysis);

export default router;
