// EduMentor AI Quiz Generator  —  Express Server Entry Point
// MongoDB Atlas Version
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// MongoDB connection
const connectDB = require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 5050;

const uploadsDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
[uploadsDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

// Respond to ALL OPTIONS preflight requests BEFORE any routes
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const materialRoutes = require("./src/routes/material.routes");
const quizRoutes = require("./src/routes/quiz.routes");
const answerRoutes = require("./src/routes/answer.routes");
const userRoutes = require("./src/routes/user.routes");
const reinforceRoutes = require("./src/routes/reinforce.routes");
const flashcardRoutes = require("./src/routes/flashcard.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const analysisRoutes = require("./src/routes/analysis.routes");

app.use("/api/materials", materialRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/quizzes", quizRoutes); // Alias: /api/quizzes → same router
app.use("/api/answers", answerRoutes);
app.use("/api/attempts", answerRoutes); // Alias: /api/attempts → same router
app.use("/api/users", userRoutes);
app.use("/api/reinforce", reinforceRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analysis", analysisRoutes);

// CONVENIENCE / ALIAS ROUTES  (used by original spec)
// These map the spec URLs directly to the same controllers.
const { uploadMaterial } = require("./src/controllers/material.controller");
const {
  generateQuiz,
  regenerateQuiz,
} = require("./src/controllers/quiz.controller");
const { submitAnswers } = require("./src/controllers/answer.controller");
const { protect } = require("./src/middleware/auth.middleware");

// Multer for the alias /upload-material route
const aliasUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`Unsupported: ${file.mimetype}`), false);
  },
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
});

// POST /upload-material  → same as POST /api/materials/upload (protected)
app.post(
  "/upload-material",
  protect,
  aliasUpload.array("files", 10),
  uploadMaterial,
  );

// POST /generate-quiz    → same as POST /api/quiz/generate (protected)
app.post("/generate-quiz", protect, generateQuiz);

// POST /submit-answers   → same as POST /api/answers/submit (protected)
app.post("/submit-answers", protect, submitAnswers);

// POST /regenerate       → same as POST /api/quiz/regenerate (protected)
app.post("/regenerate", protect, regenerateQuiz);

app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    service: "EduMentor AI Backend",
    database: "MongoDB Atlas",
    timestamp: new Date().toISOString(),
  }),
  );

app.use((err, _req, res, _next) => {
  console.error(" Error:", err.message);

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(", ") });
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, error: "Invalid ID format" });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: "Duplicate field value entered",
    });
  }

  res
    .status(err.status || 500)
    .json({ success: false, error: err.message || "Internal Server Error" });
});

const { warmUp, checkHealth } = require("./src/services/ollama.service");

app.listen(PORT, async () => {
  console.log("\n");
  console.log("       EduMentor AI Backend                 ");
  console.log("       MongoDB Atlas Edition                   ");
  console.log(`  Server  : http://localhost:${PORT}`);
  console.log(
    `  Ollama  : ${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}`,
    );
  console.log(`  Model   : ${process.env.OLLAMA_MODEL || "llama3"}`);

  // Connect to MongoDB Atlas
  await connectDB();

  console.log("\n  Routes:");
  console.log("    POST /api/materials/upload  — upload + extract text");
  console.log("    GET  /api/materials         — list all materials");
  console.log("    POST /api/quiz/generate     — generate quiz");
  console.log("    GET  /api/quiz/:id          — get quiz by ID");
  console.log("    GET  /api/quiz/material/:id — quizzes by material");
  console.log("    GET  /api/quizzes           — list all quizzes");
  console.log("    POST /api/answers/submit    — score answers");
  console.log("    GET  /api/answers/results/:quizId — quiz results");
  console.log("    POST /api/users/register    — register user");
  console.log("    POST /api/users/login       — login user");
  console.log("    GET  /api/users/profile     — get user profile");
  console.log("    POST /upload-material       — alias");
  console.log("    POST /generate-quiz         — alias");
  console.log("    POST /submit-answers        — alias");
  console.log("    POST /regenerate            — alias");
  console.log("    GET  /api/reinforce/weak-topics   — weak topics");
  console.log("    POST /api/reinforce/generate-quiz — reinforcement quiz");
  console.log(
    "    POST /api/reinforce/submit        — submit & update mastery",
    );
  console.log("    GET  /api/reinforce/progress      — topic progress");
  console.log("    POST /api/flashcards/generate     — generate flashcards");
  console.log("    GET  /api/flashcards              — list flashcard decks");
  console.log("    GET  /api/flashcards/:deckId      — get deck for study");
  console.log("    GET  /api/dashboard/summary       — dashboard stats");
  console.log("    GET  /api/analysis/progress       — progress analysis");
  console.log("");

  // Check Ollama status
  const health = await checkHealth();
  if (health.ok) {
    console.log(`   Ollama connected. Models: ${health.models.join(", ")}`);
    console.log(`   llama3 available: ${health.modelAvailable}`);
  } else {
    console.warn(`    Ollama not reachable: ${health.error}`);
    console.warn("      Run: ollama serve   then restart this server.\n");
    return; // Don't warm up if Ollama is unreachable
  }

  // Warm up the model
  await warmUp();
  console.log("\n   Ready to generate quizzes!\n");
});
