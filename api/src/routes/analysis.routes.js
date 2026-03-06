// Analysis Routes — Protected
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getProgressAnalysis } = require("../controllers/analysis.controller");

// GET /api/analysis/progress — full progress analysis data
router.get("/progress", protect, getProgressAnalysis);

module.exports = router;
