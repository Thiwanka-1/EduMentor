// api/src/routes/chatRoutes.js
import express from "express";
import { chatWithBuddy } from "../controllers/chatController.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Because server.js uses app.use("/api/chat", buddychatRoutes)
// The following route resolves to POST /api/chat
router.post("/", protect, chatWithBuddy);

export default router;