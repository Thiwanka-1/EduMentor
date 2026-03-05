// ──────────────────────────────────────────────────────────────
// Answer / Attempt Routes  — Protected with Auth
// ──────────────────────────────────────────────────────────────
const express = require("express");
const {
  submitAnswers,
  getResults,
  getAttemptsByQuiz,
  getAttemptsByUser,
} = require("../controllers/answer.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// Submit answers (score + save attempt) — protected
router.post("/submit", protect, submitAnswers);

// Get results for a specific quiz — protected
router.get("/results/:quizId", protect, getResults);

// Get attempts by quiz (alias) — protected
router.get("/attempts/:quizId", protect, getAttemptsByQuiz);

// Get attempts by user — protected
router.get("/user/:userId", protect, getAttemptsByUser);

module.exports = router;
