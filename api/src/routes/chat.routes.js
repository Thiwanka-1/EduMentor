import { Router } from "express";
import { generateAndSave } from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// ✅ only logged-in user can generate/save explanations
router.post("/chat", protect, generateAndSave);

export default router;
