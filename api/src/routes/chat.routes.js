import { Router } from "express";
import { generateAndSave } from "../controllers/chat.controller.js";

const router = Router();

// POST /api/chat  -> generates + saves -> returns {content, id}
router.post("/chat", generateAndSave);

export default router;
