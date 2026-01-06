// api/routes/sessionRoutes.js
import express from "express";
import {
  listSessions,
  createSession,
  renameSession,
  deleteSession,
  getMessages,
} from "../controllers/sessionController.js";

const router = express.Router();

// GET /api/sessions?userId=...
router.get("/", listSessions);

// POST /api/sessions { userId, title? }
router.post("/", createSession);

// GET /api/sessions/:id/messages?userId=...
router.get("/:id/messages", getMessages);

// PATCH /api/sessions/:id { userId, title }
router.patch("/:id", renameSession);

// DELETE /api/sessions/:id?userId=...
router.delete("/:id", deleteSession);

export default router;
