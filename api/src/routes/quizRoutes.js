import express from 'express';
import { generateQuizFromMaterial, submitQuiz, generateAdaptiveQuiz } from '../controllers/quizController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route to generate a new quiz
router.post('/generate', protect, generateQuizFromMaterial);
router.post('/:quizId/submit', protect, submitQuiz);

router.post('/generate-adaptive', protect, generateAdaptiveQuiz);
export default router;