// api/src/routes/sessionRoutes.js
import express from "express";
import {
  listSessions,
  createSession,
  renameSession,
  deleteSession,
  getMessages,
} from "../controllers/sessionController.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Because server.js uses app.use("/api/sessions", sessionRoutes)
// The following route resolves to GET /api/sessions
router.get("/", protect, listSessions);

// Resolves to POST /api/sessions
router.post("/", protect, createSession);

// Resolves to GET /api/sessions/:id/messages
router.get("/:id/messages", protect, getMessages);

// Resolves to PATCH /api/sessions/:id
router.patch("/:id", protect, renameSession);

// Resolves to DELETE /api/sessions/:id
router.delete("/:id", protect, deleteSession);

export default router;