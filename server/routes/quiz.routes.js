// ──────────────────────────────────────────────────────────────
// Quiz Routes  — Protected with Auth
// ──────────────────────────────────────────────────────────────
const express = require("express");
const {
  generateQuiz,
  regenerateQuiz,
  getQuizById,
  getQuizzesByMaterial,
  listAllQuizzes,
  ollamaHealth,
} = require("../controllers/quiz.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// List all quizzes
router.get("/", protect, listAllQuizzes);

// Generate & regenerate
router.post("/generate", protect, generateQuiz);
router.post("/regenerate", protect, regenerateQuiz);

// Ollama health check (public — frontend checks on load)
router.get("/health", ollamaHealth);

// Get quizzes by material
router.get("/material/:materialId", protect, getQuizzesByMaterial);

// Get quiz by ID (keep this LAST to avoid matching other routes)
router.get("/:id", protect, getQuizById);

module.exports = router;
