import express from "express";
import { submitAnswers, getResults, getAttemptsByQuiz, getAttemptsByUser } from "../controllers/answer.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Submit answers (score + save attempt) — protected
router.post("/submit", protect, submitAnswers);

// Get results for a specific quiz — protected
router.get("/results/:quizId", protect, getResults);

// Get attempts by quiz (alias) — protected
router.get("/attempts/:quizId", protect, getAttemptsByQuiz);

// Get attempts by user — protected
router.get("/user/:userId", protect, getAttemptsByUser);

export default router;