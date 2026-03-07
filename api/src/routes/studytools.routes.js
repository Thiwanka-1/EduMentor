import { Router } from "express";
import { getRelatedConcepts } from "../controllers/studytools.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// ✅ only logged-in owner can access related topics
router.get("/explanations/:id/related", protect, getRelatedConcepts);

export default router;
