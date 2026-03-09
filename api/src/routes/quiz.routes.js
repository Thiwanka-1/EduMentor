import express from "express";
import { generateQuiz, regenerateQuiz, getQuizById, getQuizzesByMaterial, listAllQuizzes, ollamaHealth } from "../controllers/quiz.controller.js";
import { protect } from "../middleware/auth.middleware.js";

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

export default router;