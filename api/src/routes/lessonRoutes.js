import express from "express";
import {
  chatLesson,
  getLessonSessionById,
  getLessonSessions,
  updateLessonMedia,
  updateLessonNotes,
  deleteLessonSession,
} from "../controllers/lessonController.js";
// FIX: Use named import to match your middleware
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All lesson routes are protected by the same auth logic as your profile
router.post("/chat", protect, chatLesson);
router.get("/sessions", protect, getLessonSessions);
router.get("/sessions/:id", protect, getLessonSessionById);
router.put("/sessions/:id/notes", protect, updateLessonNotes);
router.put("/sessions/:id/media", protect, updateLessonMedia);
router.delete("/sessions/:id", protect, deleteLessonSession);

export default router;