import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { uploadMaterial, listAllMaterials, getMaterialById, removeMaterial } from "../controllers/material.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const uploadsDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: PDF, DOCX, PNG, JPG`,
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024,
    files: 10, // max 10 files at once
  },
});

router.post("/upload", protect, upload.array("files", 10), uploadMaterial);
router.get("/", protect, listAllMaterials);
router.get("/:id", protect, getMaterialById);
router.delete("/:id", protect, removeMaterial);

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 50}MB.`,
      });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.message && err.message.includes("Unsupported file type")) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next(err);
});

export default router;