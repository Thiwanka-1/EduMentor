import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";

const router = express.Router();

// GET /api/dashboard/summary — aggregated dashboard stats
router.get("/summary", protect, getDashboardSummary);

export default router;