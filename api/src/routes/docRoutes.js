// api/routes/docRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { uploadPdfDoc, uploadTextDoc, getSessionNotes } from "../controllers/docController.js";
import { protect } from "../middleware/auth.middleware.js"; // 🚨 ADD THIS

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({ storage });

// 🚨 Apply the protect middleware so req.user exists!
router.post("/text", protect, uploadTextDoc);
router.post("/pdf", protect, upload.single("file"), uploadPdfDoc);
router.get("/notes/:sessionId", protect, getSessionNotes);
export default router;