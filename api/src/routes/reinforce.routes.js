import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getWeakTopics, generateReinforcementQuiz, submitReinforcementAnswers, getProgress } from "../controllers/reinforce.controller.js";

const router = express.Router();

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

export default router;