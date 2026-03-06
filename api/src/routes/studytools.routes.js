import { Router } from "express";
import { getRelatedConcepts } from "../controllers/studytools.controller.js";

const router = Router();

// GET /api/explanations/:id/related
router.get("/explanations/:id/related", getRelatedConcepts);

export default router;
