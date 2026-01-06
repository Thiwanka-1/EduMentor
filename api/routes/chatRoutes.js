// api/routes/chatRoutes.js
import express from "express";
import { chatWithBuddy } from "../controllers/chatController.js";

const router = express.Router();
router.post("/", chatWithBuddy);
export default router;
