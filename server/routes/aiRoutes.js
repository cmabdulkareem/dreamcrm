import express from "express";
import { getLeadAnalysis, getLeadScore } from "../controller/aiController.js";
// Assuming there's a middleware to protect routes
// import { protect } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// router.get("/analyze-lead/:id", protect, getLeadAnalysis);
router.get("/analyze-lead/:id", getLeadAnalysis);
router.get("/score-lead/:id", getLeadScore);

export default router;
