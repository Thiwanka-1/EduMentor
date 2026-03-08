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
// ROUTE & WS IMPORTS (Your Part)
// ==========================================
import slidesRoutes from "./src/routes/slidesRoutes.js";
import tutorWSConnection from "./src/ws/wsTutor.js";
import lessonWSConnection from "./src/ws/wsLesson.js";
import audioWSConnection from "./src/ws/wsAudio.js";
import { createSession } from "./src/services/sessionService.js";

/* ============================================================
   EXPRESS INITIAL SETUP
============================================================ */
const app = express();

// Middlewares (Order is strictly important!)
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173", 
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" })); // Kept your 5mb limit for TTS/Audio needs
app.use(cookieParser());

// Serve static folders
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/output", express.static("output"));

// Base Health/Test Route
app.get("/", (req, res) => {
  res.send("EduMentor API running 🚀");
});
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ============================================================
   ROUTES
============================================================ */
// Team Members' Routes
app.use("/api/sessions", sessionRoutes);
app.use("/api/chat", buddychatRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/mveg", chatRoutes);
app.use("/api/mveg", explanationRoutes);
app.use("/api/mveg", studyToolsRoutes);

// Your Routes
app.use("/slides", slidesRoutes);

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

  // Save MP3
  if (!fs.existsSync("output")) fs.mkdirSync("output", { recursive: true });

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
   HTTP + WEBSOCKET SERVER INITIALIZATION
============================================================ */
const PORT = process.env.PORT || 5000;

// Create HTTP Server using Express
const httpServer = http.createServer(app);

// Attach WebSocket Server to the same HTTP Server
const wss = new WebSocketServer({ server: httpServer });

/* ============================================================
   WEBSOCKET ROUTING
============================================================ */
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

  ws.send(JSON.stringify({ error: "Invalid WS endpoint" }));
  ws.close();
});

/* ============================================================
   CONNECT DB & START SERVER
============================================================ */
console.log("🔥 EduMentor Backend Starting...");

connectDB()
  .then(() => {
    // Start listening on the combined HTTP+WS server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`⚡ WS endpoints ready: ws://localhost:${PORT}/ws/tutor , /ws/lesson , /ws/audio`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });