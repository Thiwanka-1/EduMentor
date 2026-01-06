//api/routes/docRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { uploadPdfDoc, uploadTextDoc } from "../controllers/docController.js";

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

router.post("/text", uploadTextDoc);
router.post("/pdf", upload.single("file"), uploadPdfDoc);

export default router;
