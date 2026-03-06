import { Router } from "express";
import {
  listExplanations,
  getExplanation,
  deleteExplanation,
  renameExplanation,
} from "../controllers/explanations.controller.js";

const router = Router();

router.get("/explanations", listExplanations);
router.get("/explanations/:id", getExplanation);
router.delete("/explanations/:id", deleteExplanation);
// ✅ rename title
router.patch("/explanations/:id/title", renameExplanation);

export default router;
