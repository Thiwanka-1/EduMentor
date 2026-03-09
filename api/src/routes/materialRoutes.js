import express from 'express';
import multer from 'multer';
import { uploadMaterial } from '../controllers/materialController.js';
import { protect } from '../middleware/auth.middleware.js'; // Import your auth middleware

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } 
});

// Add 'protect' before the upload middleware
router.post('/upload', protect, upload.single('file'), uploadMaterial);

export default router;