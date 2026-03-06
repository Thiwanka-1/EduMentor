// Dashboard Routes — Protected
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getDashboardSummary } = require("../controllers/dashboard.controller");

// GET /api/dashboard/summary — aggregated dashboard stats
router.get("/summary", protect, getDashboardSummary);

module.exports = router;
