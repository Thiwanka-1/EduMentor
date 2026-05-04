// Backend/server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import cookieParser from "cookie-parser"; 
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import dns from "node:dns/promises";

// Fix DNS resolution issues for certain MongoDB/Ollama environments
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// ==========================================
// DB CONNECTION
// ==========================================
import connectDB from "./src/config/db.js";

// ==========================================
// ROUTE IMPORTS (Team Members)
// ==========================================
import authRoutes from "./src/routes/auth.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import explanationRoutes from "./src/routes/explanations.routes.js";
import studyToolsRoutes from "./src/routes/studytools.routes.js";
import buddychatRoutes from "./src/routes/chatRoutes.js";
import docRoutes from "./src/routes/docRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";

// ==========================================
// ROUTE & WS IMPORTS (Your WS & Slides)
// ==========================================
import slidesRoutes from "./src/routes/slidesRoutes.js";
import tutorWSConnection from "./src/ws/wsTutor.js";
import lessonWSConnection from "./src/ws/wsLesson.js";
import audioWSConnection from "./src/ws/wsAudio.js";
import sttWSConnection from "./src/ws/wsSTT.js"; 
import { createSession } from "./src/services/sessionService.js";

// ==========================================
// ROUTE IMPORTS (Ollama / Quizzes / Flashcards)
// ==========================================
import materialRoutes from "./src/routes/material.routes.js";
import quizRoutes from "./src/routes/quiz.routes.js";
import answerRoutes from "./src/routes/answer.routes.js";
import reinforceRoutes from "./src/routes/reinforce.routes.js";
import flashcardRoutes from "./src/routes/flashcard.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import analysisRoutes from "./src/routes/analysis.routes.js";

// ==========================================
// CONTROLLERS FOR ALIAS ROUTES & MIDDLEWARE
// ==========================================
import { uploadMaterial } from "./src/controllers/material.controller.js";
import { generateQuiz, regenerateQuiz } from "./src/controllers/quiz.controller.js";
import { submitAnswers } from "./src/controllers/answer.controller.js";
import { protect } from "./src/middleware/auth.middleware.js"; // <--- Points to the good cookie middleware!

// ==========================================
// OLLAMA SERVICES
// ==========================================
import { warmUp, checkHealth } from "./src/services/ollama.service.js";

/* ============================================================
   EXPRESS INITIAL SETUP & DIRECTORIES
============================================================ */
const app = express();
const PORT = process.env.PORT || 5000;

// Handle file paths
const uploadsDir = path.resolve(process.cwd(), "uploads");
const outputDir = path.resolve(process.cwd(), "output");

[uploadsDir, outputDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Middlewares (Order is strictly important!)
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    process.env.ALLOWED_ORIGIN
  ].filter(Boolean),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true, // Strictly required for cookies!
  optionsSuccessStatus: 200,
};

app.options(/(.*)/, cors(corsOptions));
app.use(cors(corsOptions));

// Bumped limits to 50mb to handle document uploads for Ollama safely
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Serve static folders
app.use("/uploads", express.static(uploadsDir));
app.use("/output", express.static(outputDir));

// Base Health/Test Routes
app.get("/", (req, res) => res.send("EduMentor API running 🚀"));
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    service: "EduMentor AI Backend",
    database: "MongoDB Atlas",
    timestamp: new Date().toISOString(),
  })
);

/* ============================================================
   ROUTES
============================================================ */
// Team Members' Routes
app.use("/api/auth", authRoutes); // Handling our cookie auth!
app.use("/api/sessions", sessionRoutes);
app.use("/api/chat", buddychatRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/mveg", chatRoutes);
app.use("/api/mveg", explanationRoutes);
app.use("/api/mveg", studyToolsRoutes);

// Your WS/Slides Routes
app.use("/slides", slidesRoutes);

// Your Ollama / Quiz Routes
app.use("/api/materials", materialRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/quizzes", quizRoutes); // Alias
app.use("/api/answers", answerRoutes);
app.use("/api/attempts", answerRoutes); // Alias
app.use("/api/reinforce", reinforceRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analysis", analysisRoutes);

/* ============================================================
   MULTER SETUP & ALIAS ROUTES (For Ollama Docs)
============================================================ */
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
  limits: { fileSize: 50 * 1024 * 1024, files: 10 }, // 50MB limit
});

// Alias Routes
app.post("/upload-material", protect, aliasUpload.array("files", 10), uploadMaterial);
app.post("/generate-quiz", protect, generateQuiz);
app.post("/submit-answers", protect, submitAnswers);
app.post("/regenerate", protect, regenerateQuiz);

/* ============================================================
   VISEME GENERATOR & ELEVENLABS TTS LOGIC
============================================================ */
function estimateDurationMs(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length || 1;
  const sec = words / 2.3; // ~140 wpm
  return Math.max(1200, Math.round(sec * 1000));
}

function visemeFromText(text, durationMs) {
  const s = (text || "").toLowerCase().replace(/\s+/g, " ").trim();
  const totalSec = Math.max(1.2, (durationMs || 1500) / 1000);
  const n = Math.max(1, s.length);

  const pick = (ch) => {
    if ("ae".includes(ch)) return "AA";
    if (ch === "i") return "EE";
    if (ch === "o") return "OH";
    if (ch === "u") return "OO";
    if ("fvw".includes(ch)) return "FV";
    if ("bmp".includes(ch)) return "MBP";
    if ("szxctk".includes(ch)) return "SS";
    if (ch === " ") return "SIL";
    return "AA";
  };

  const out = [];
  let last = "SIL";

  for (let i = 0; i < n; i++) {
    const v = pick(s[i]);
    const t = (i / n) * totalSec;

    if (v !== last) {
      out.push({ t: Number(t.toFixed(3)), v });
      last = v;
    }
  }

  out.push({ t: Number(totalSec.toFixed(3)), v: "SIL" });
  return out;
}

async function generateSpeech(text) {
  console.log("🔊 ElevenLabs TTS:", text);

  const apiKey = process.env.ELEVEN_API_KEY;
  const voiceId = process.env.ELEVEN_VOICE_ID;

  if (!apiKey) throw new Error("Missing ELEVEN_API_KEY in .env");
  if (!voiceId) throw new Error("Missing ELEVEN_VOICE_ID in .env");

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("❌ ElevenLabs Error:", errText);
    throw new Error(`ElevenLabs TTS failed (${response.status})`);
  }

  const id = Date.now().toString();
  const fileName = `audio_${id}.mp3`;
  const audioPath = path.join("output", fileName);

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(audioPath, audioBuffer);

  console.log("🎵 Audio Saved:", audioPath);

  return {
    audioUrl: `/output/${fileName}`,
    durationMs: estimateDurationMs(text),
  };
}

app.post("/api/talk", async (req, res) => {
  const { text } = req.body;

  try {
    console.log("📩 /api/talk request:", text);

    if (!text?.trim()) {
      return res.status(400).json({ ok: false, error: "text is required" });
    }

    const { audioUrl, durationMs } = await generateSpeech(text);
    const visemes = visemeFromText(text, durationMs);

    return res.json({
      ok: true,
      audioUrl,      
      durationMs,    
      visemes,       
    });
  } catch (err) {
    console.error("❌ Error in /api/talk:", err);
    return res.status(500).json({ ok: false, error: err.message || "TTS failed" });
  }
});

/* ============================================================
   GLOBAL ERROR HANDLER
============================================================ */
app.use((err, _req, res, _next) => {
  console.error(" Error:", err.message);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(", ") });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, error: "Invalid ID format" });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, error: "Duplicate field value entered" });
  }

  res.status(err.status || 500).json({ success: false, error: err.message || "Internal Server Error" });
});

/* ============================================================
   HTTP + WEBSOCKET SERVER INITIALIZATION
============================================================ */
const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws, req) => {
  const p = req.url || "";
  console.log("🔗 WS Connected:", p);

  if (p.startsWith("/ws/tutor")) {
    const sessionId = createSession("tutor");
    ws.send(JSON.stringify({ sessionId }));
    return tutorWSConnection(ws, sessionId);
  }

  if (p.startsWith("/ws/lesson")) {
    const sessionId = createSession("lesson");
    ws.send(JSON.stringify({ sessionId }));
    return lessonWSConnection(ws, sessionId);
  }

  if (p.startsWith("/ws/audio")) {
    return audioWSConnection(ws);
  }

  if (p.startsWith("/ws/stt")) return sttWSConnection(ws);
  
  ws.send(JSON.stringify({ error: "Invalid WS endpoint" }));
  ws.close();
});

/* ============================================================
   CONNECT DB & START SERVER
============================================================ */
console.log("🔥 EduMentor Backend Starting...");

connectDB()
  .then(() => {
    httpServer.listen(PORT, async () => {
      console.log("\n=======================================================");
      console.log("       EduMentor AI Backend (MongoDB Atlas Edition)      ");
      console.log("=======================================================");
      console.log(` 🚀 Server running on : http://localhost:${PORT}`);
      console.log(` ⚡ WS endpoints ready: ws://localhost:${PORT}/ws/tutor , /ws/lesson , /ws/audio, /ws/stt`);
      console.log(` 🧠 Ollama Base URL   : ${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}`);
      console.log(` 🤖 Ollama Model      : ${process.env.OLLAMA_MODEL || "llama3"}`);
      console.log("=======================================================\n");

      // Check Ollama status
      const health = await checkHealth();
      if (health.ok) {
        console.log(` ✅ Ollama connected. Models: ${health.models.join(", ")}`);
        console.log(` ✅ Target Model available: ${health.modelAvailable}`);
      } else {
        console.warn(` ⚠️ Ollama not reachable: ${health.error}`);
        console.warn(" ⚠️ Run: 'ollama serve' then restart this server if AI features are needed.\n");
        return; 
      }

      // Warm up the model
      await warmUp();
      console.log("\n 🎉 Server fully initialized. Ready to generate quizzes & handle sockets!\n");
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });