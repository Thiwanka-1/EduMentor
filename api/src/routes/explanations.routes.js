import { Router } from "express";
import {
  listExplanations,
  getExplanation,
  deleteExplanation,
  renameExplanation,
} from "../controllers/explanations.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// ✅ all explanation routes require login
router.get("/explanations", protect, listExplanations);
router.get("/explanations/:id", protect, getExplanation);
router.delete("/explanations/:id", protect, deleteExplanation);
router.patch("/explanations/:id/title", protect, renameExplanation);

export default router;
