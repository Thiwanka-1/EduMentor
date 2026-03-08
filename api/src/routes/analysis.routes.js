import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getProgressAnalysis } from "../controllers/analysis.controller.js";

const router = express.Router();

// GET /api/analysis/progress — full progress analysis data
router.get("/progress", protect, getProgressAnalysis);

export default router;