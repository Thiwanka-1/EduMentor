// backend/routes/slidesRoutes.js
import express from "express";
import { uploadSingle, handleUploadedFile } from "../services/slidesService.js";

const router = express.Router();

router.post("/upload", uploadSingle, async (req, res) => {
  try {
    const out = await handleUploadedFile(req.file);
    res.json({ success: true, ...out });
  } catch (e) {
    console.error("❌ /slides/upload error:", e);
    res.status(500).json({ success: false, message: e.message || "Upload failed" });
  }
});

export default router;
