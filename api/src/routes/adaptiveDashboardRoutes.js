import express from 'express';
import { 
  getDashboardStats, 
  getUserMaterials, 
  getUserQuizzes, 
  getUserWeakPoints 
} from '../controllers/adaptiveDashboardController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/materials', protect, getUserMaterials);
router.get('/history', protect, getUserQuizzes);
router.get('/weak-topics', protect, getUserWeakPoints);

export default router;