// ──────────────────────────────────────────────────────────────
// Reinforce Routes — Adaptive Concept Reinforcement Engine
// ──────────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  getWeakTopics,
  generateReinforcementQuiz,
  submitReinforcementAnswers,
  getProgress,
} = require("../controllers/reinforce.controller");

// All reinforcement routes are protected (require login)
router.use(protect);

// GET  /api/reinforce/weak-topics  — list weak topics with progress
router.get("/weak-topics", getWeakTopics);

// POST /api/reinforce/generate-quiz — generate quiz for a topic
router.post("/generate-quiz", generateReinforcementQuiz);

// POST /api/reinforce/submit — submit answers and update mastery
router.post("/submit", submitReinforcementAnswers);

// GET  /api/reinforce/progress — all topic progress for user
router.get("/progress", getProgress);

module.exports = router;
