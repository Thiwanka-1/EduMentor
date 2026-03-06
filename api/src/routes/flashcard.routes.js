// Flashcard Routes  — Protected with Auth
const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const {
  generateFlashcards,
  listDecks,
  getDeckById,
  updateDeck,
  deleteDeck,
} = require("../controllers/flashcard.controller");
const { protect } = require("../middleware/auth.middleware");

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
    files: 1,
  },
});


// Generate flashcards from PDF upload or pasted text
router.post("/generate", protect, upload.single("file"), generateFlashcards);

// List all decks for the user
router.get("/", protect, listDecks);

// Get a specific deck by ID (for study mode)
router.get("/:deckId", protect, getDeckById);

// Update a deck (name, cards, etc.)
router.put("/:deckId", protect, updateDeck);

// Delete a deck
router.delete("/:deckId", protect, deleteDeck);

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

module.exports = router;
