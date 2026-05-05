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
import crypto from "crypto";

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
import lessonRoutes from "./src/routes/lessonRoutes.js";

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




// Your WS/Slides Routes -Sarangi
app.use("/slides", slidesRoutes);
app.use("/api/lessons", lessonRoutes);

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
function estimateDurationMs(text = "") {
  const words =
    String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length || 1;

  const sec = words / 2.3;
  return Math.max(1200, Math.round(sec * 1000));
}

function visemeFromText(text, durationMs) {
  const raw = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  const totalSec = Math.max(1.2, (durationMs || 1500) / 1000);

  if (!raw) {
    return [
      { t: 0, v: "SIL" },
      { t: Number(totalSec.toFixed(3)), v: "SIL" },
    ];
  }

  function isSinhala(ch) {
    return /[\u0D80-\u0DFF]/.test(ch);
  }

  function isTamil(ch) {
    return /[\u0B80-\u0BFF]/.test(ch);
  }

  function isPunctuation(ch) {
    return /[.,!?;:()[\]{}'"“”‘’\-–—।॥]/.test(ch);
  }

  function pickEnglish(ch) {
    const lower = ch.toLowerCase();

    if ("a".includes(lower)) return "AA";
    if ("ei".includes(lower)) return "EE";
    if ("o".includes(lower)) return "OH";
    if ("u".includes(lower)) return "OO";

    if ("bmp".includes(lower)) return "MBP";
    if ("fv".includes(lower)) return "FV";
    if ("szxctjkgdq".includes(lower)) return "SS";
    if ("w".includes(lower)) return "OO";
    if ("rlhyn".includes(lower)) return "AA";

    return "AA";
  }

  function pickSinhala(ch) {
    if ("අආඇඈාැෑ".includes(ch)) return "AA";
    if ("ඉඊිීඑඒෙේෛ".includes(ch)) return "EE";
    if ("උඌුූ".includes(ch)) return "OO";
    if ("ඔඕොෝෞ".includes(ch)) return "OH";

    if ("බභපඵමඹ".includes(ch)) return "MBP";
    if ("ෆව".includes(ch)) return "FV";
    if ("සශෂචඡජඣකඛගඝටඨඩඪතථදධ".includes(ch)) return "SS";
    if ("නණංඞඬරලළයහ".includes(ch)) return "AA";

    return "AA";
  }

  function pickTamil(ch) {
    if ("அஆா".includes(ch)) return "AA";
    if ("இஈிீஎஏெேை".includes(ch)) return "EE";
    if ("உஊுூ".includes(ch)) return "OO";
    if ("ஒஓொோௌ".includes(ch)) return "OH";

    if ("பம".includes(ch)) return "MBP";
    if ("வ".includes(ch)) return "FV";
    if ("சஜஷஸஹகடதற".includes(ch)) return "SS";
    if ("னநணஙஞரலளழய".includes(ch)) return "AA";

    return "AA";
  }

  function pickViseme(ch) {
    if (ch === " ") return "SIL";
    if (isPunctuation(ch)) return "SIL";
    if (isSinhala(ch)) return pickSinhala(ch);
    if (isTamil(ch)) return pickTamil(ch);
    return pickEnglish(ch);
  }

  function getWeight(ch) {
    if (ch === " ") return 0.45;
    if (isPunctuation(ch)) return 0.8;

    const lower = ch.toLowerCase();

    if ("aeiou".includes(lower)) return 1.2;

    if ("අආඇඈාැෑඉඊිීඋඌුූඑඒෙේඔඕොෝෞ".includes(ch)) {
      return 1.2;
    }

    if ("அஆாஇஈிீஉஊுூஎஏெேஒஓொோௌ".includes(ch)) {
      return 1.2;
    }

    return 0.85;
  }

  const chars = [...raw];
  const totalWeight = chars.reduce((sum, ch) => sum + getWeight(ch), 0) || 1;

  const out = [];
  let currentTime = 0;
  let lastViseme = "SIL";
  let lastEventTime = -1;

  function pushEvent(t, v, force = false) {
    const fixedT = Number(Math.max(0, Math.min(t, totalSec)).toFixed(3));

    if (!force && v === lastViseme && fixedT - lastEventTime < 0.13) {
      return;
    }

    out.push({ t: fixedT, v });
    lastViseme = v;
    lastEventTime = fixedT;
  }

  pushEvent(0, "SIL", true);

  for (const ch of chars) {
    const weight = getWeight(ch);
    const segmentDuration = (weight / totalWeight) * totalSec;
    const v = pickViseme(ch);

    const eventTime = currentTime + Math.min(0.04, segmentDuration * 0.25);

    if (v === "SIL") {
      pushEvent(currentTime, "SIL");
    } else {
      pushEvent(eventTime, v);
    }

    currentTime += segmentDuration;
  }

  const refreshed = [];

  for (let i = 0; i < out.length; i += 1) {
    const current = out[i];
    const next = out[i + 1];

    refreshed.push(current);

    if (!next) continue;

    const gap = next.t - current.t;

    if (gap > 0.32 && current.v !== "SIL") {
      const count = Math.floor(gap / 0.26);

      for (let j = 1; j <= count; j += 1) {
        const t = current.t + j * 0.26;

        if (t < next.t - 0.07) {
          refreshed.push({
            t: Number(t.toFixed(3)),
            v: current.v,
          });
        }
      }
    }
  }

  refreshed.push({
    t: Number(totalSec.toFixed(3)),
    v: "SIL",
  });

  return refreshed
    .sort((a, b) => a.t - b.t)
    .filter((item, index, arr) => {
      if (index === 0) return true;

      const prev = arr[index - 1];
      return !(item.t === prev.t && item.v === prev.v);
    });
}



function getBooleanEnv(name, defaultValue = false) {
  const value = process.env[name];

  if (value === undefined) return defaultValue;

  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

/* ============================================================
   HYBRID TTS
   English / Tamil / Singlish -> ElevenLabs
   Sinhala -> Google Sinhala fallback
============================================================ */

function normalizeTalkLanguageMode(languageMode = "english") {
  const mode = String(languageMode || "english").toLowerCase().trim();

  if (["english", "sinhala", "singlish", "tamil"].includes(mode)) {
    return mode;
  }

  return "english";
}


function getElevenLabsVoiceId(languageMode = "english") {
  const mode = normalizeTalkLanguageMode(languageMode);

  if (mode === "tamil") {
    return (
      process.env.ELEVENLABS_TAMIL_VOICE_ID ||
      process.env.ELEVENLABS_VOICE_ID ||
      ""
    );
  }

  if (mode === "singlish") {
    return (
      process.env.ELEVENLABS_SINGLISH_VOICE_ID ||
      process.env.ELEVENLABS_VOICE_ID ||
      ""
    );
  }

  return (
    process.env.ELEVENLABS_ENGLISH_VOICE_ID ||
    process.env.ELEVENLABS_VOICE_ID ||
    ""
  );
}

function getElevenLabsLanguageCode(languageMode = "english") {
  const mode = normalizeTalkLanguageMode(languageMode);

  if (mode === "tamil") return "ta";
  if (mode === "singlish") return "en";
  return "en";
}

function shouldUseGoogleSinhalaFallback(languageMode = "english") {
  const mode = normalizeTalkLanguageMode(languageMode);

  const provider = String(process.env.SINHALA_TTS_PROVIDER || "google")
    .toLowerCase()
    .trim();

  return mode === "sinhala" && provider === "google";
}

function cleanTextForSpeech(text = "") {
  let clean = String(text || "");

  // Remove fenced code blocks
  clean = clean.replace(/```[\s\S]*?```/g, " ");

  // Inline code: `text` -> text
  clean = clean.replace(/`([^`]+)`/g, "$1");

  // Markdown links: [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  // Raw URLs
  clean = clean.replace(/https?:\/\/\S+/g, " ");

  // Markdown headings
  clean = clean.replace(/^#{1,6}\s+/gm, "");

  // Markdown blockquotes
  clean = clean.replace(/^>\s?/gm, "");

  // Bullet markers
  clean = clean.replace(/^\s*[-*+]\s+/gm, "");

  // Numbered lists
  clean = clean.replace(/^\s*(\d+)\.\s+/gm, "$1. ");

  // Bold / italic / strike markers
  clean = clean.replace(/[*_~]+/g, "");

  // Table symbols and backslashes
  clean = clean.replace(/[|\\]/g, " ");

  // Slash often sounds awkward in Sinhala/Tamil TTS
  clean = clean.replace(/\s*\/\s*/g, " ");

  // Symbols often spoken aloud by Google/ElevenLabs
  clean = clean.replace(/[#$%^&={}\[\]<>]/g, " ");

  // Decorative bullets
  clean = clean.replace(/[•●◆■□▪▫]+/g, " ");

  // Repeated whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

function getSafeTTSText(text = "") {
  const cleanText = cleanTextForSpeech(text);

  const maxChars = Number(process.env.ELEVENLABS_TTS_MAX_CHARS || 1800);

  if (cleanText.length <= maxChars) {
    return {
      text: cleanText,
      truncated: false,
      originalLength: String(text || "").length,
    };
  }

  return {
    text: `${cleanText.slice(0, maxChars).trim()}...`,
    truncated: true,
    originalLength: String(text || "").length,
  };
}

function splitTextForTTS(text = "", maxLength = 180) {
  const cleanText = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return [];

  const sentences =
    cleanText.match(/[^.!?。！？\n]+[.!?。！？]?/g) || [cleanText];

  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    const part = sentence.trim();
    if (!part) continue;

    const next = `${current} ${part}`.trim();

    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (part.length <= maxLength) {
      current = part;
    } else {
      for (let i = 0; i < part.length; i += maxLength) {
        chunks.push(part.slice(i, i + maxLength));
      }
    }
  }

  if (current) chunks.push(current);

  return chunks;
}

function buildTTSCacheKey({ provider, text, languageMode, voiceId, modelId }) {
  return crypto
    .createHash("sha256")
    .update(`${provider}|${languageMode}|${voiceId}|${modelId}|${text}`)
    .digest("hex")
    .slice(0, 32);
}

/* -----------------------------
   ElevenLabs TTS
----------------------------- */

async function generateElevenLabsSpeech({
  text,
  languageMode,
  outputPath,
  voiceId,
  modelId,
}) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY in .env");
  }

  if (!voiceId) {
    throw new Error("Missing ELEVENLABS_VOICE_ID in .env");
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const body = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: Number(process.env.ELEVENLABS_STABILITY || 0.5),
      similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY_BOOST || 0.75),
      style: Number(process.env.ELEVENLABS_STYLE || 0.35),
      use_speaker_boost: getBooleanEnv("ELEVENLABS_USE_SPEAKER_BOOST", true),
    },
  };

  if (getBooleanEnv("ELEVENLABS_FORCE_LANGUAGE_CODE", false)) {
    body.language_code = getElevenLabsLanguageCode(languageMode);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    console.error("ElevenLabs TTS error:", {
      status: response.status,
      statusText: response.statusText,
      errorText,
    });

    if (response.status === 401) {
      throw new Error("ElevenLabs API key is invalid. Check ELEVENLABS_API_KEY.");
    }

    if (response.status === 402) {
      throw new Error(
        "ElevenLabs credits or billing problem. Check your plan and available credits."
      );
    }

    if (response.status === 404) {
      throw new Error("ElevenLabs voice ID not found. Check ELEVENLABS_VOICE_ID.");
    }

    throw new Error(`ElevenLabs TTS failed with status ${response.status}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  if (!audioBuffer.length) {
    throw new Error("ElevenLabs returned empty audio.");
  }

  fs.writeFileSync(outputPath, audioBuffer);

  return audioBuffer.length;
}

/* -----------------------------
   Google Sinhala fallback TTS
----------------------------- */

async function downloadGoogleTTSChunk({ text, lang }) {
  const params = new URLSearchParams({
    ie: "UTF-8",
    q: text,
    tl: lang,
    client: "tw-ob",
  });

  const url = `https://translate.google.com/translate_tts?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Referer: "https://translate.google.com/",
      Accept: "audio/mpeg,audio/*,*/*",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    throw new Error(
      `Google Sinhala TTS failed with status ${response.status}. ${errorText.slice(
        0,
        160
      )}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateGoogleSinhalaSpeech({ text, outputPath }) {
  const chunks = splitTextForTTS(text, 180);

  if (!chunks.length) {
    throw new Error("No Sinhala text provided for fallback TTS.");
  }

  const audioBuffers = [];

  for (const chunk of chunks) {
    const audioBuffer = await downloadGoogleTTSChunk({
      text: chunk,
      lang: "si",
    });

    audioBuffers.push(audioBuffer);
  }

  if (!audioBuffers.length) {
    throw new Error("Google Sinhala TTS returned empty audio.");
  }

  const finalBuffer = Buffer.concat(audioBuffers);
  fs.writeFileSync(outputPath, finalBuffer);

  return {
    audioBytes: finalBuffer.length,
    chunkCount: chunks.length,
  };
}

/* ============================================================
   MAIN TTS ROUTE
============================================================ */

app.post("/api/talk", async (req, res) => {
  try {
    const { text = "", language = "english", languageMode = "" } = req.body;

    const cleanInputText = String(text || "").trim();

    if (!cleanInputText) {
      return res.status(400).json({
        ok: false,
        error: "text required",
      });
    }

    const selectedLanguageMode = normalizeTalkLanguageMode(
      languageMode || language
    );

    const safeTTS = getSafeTTSText(cleanInputText);

    if (!safeTTS.text) {
      return res.status(400).json({
        ok: false,
        error: "cleaned text is empty",
      });
    }

    const outDir = path.join(outputDir, "generated");

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const useSinhalaFallback =
      shouldUseGoogleSinhalaFallback(selectedLanguageMode);

    const provider = useSinhalaFallback ? "google-sinhala" : "elevenlabs";

    const modelId = useSinhalaFallback
      ? "google-translate-tts-si"
      : process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

    const voiceId = useSinhalaFallback
      ? "google-si-default"
      : getElevenLabsVoiceId(selectedLanguageMode);

    const cacheKey = buildTTSCacheKey({
      provider,
      text: safeTTS.text,
      languageMode: selectedLanguageMode,
      voiceId,
      modelId,
    });

    const fileName = `${provider}_${cacheKey}.mp3`;
    const outputPath = path.join(outDir, fileName);

    let cached = false;
    let audioBytes = 0;
    let chunkCount = 1;

    if (fs.existsSync(outputPath)) {
      cached = true;
      audioBytes = fs.statSync(outputPath).size;

      console.log("TTS cache hit:", {
        provider,
        languageMode: selectedLanguageMode,
        fileName,
      });
    } else if (useSinhalaFallback) {
      console.log("Sinhala fallback TTS:", {
        provider,
        languageMode: selectedLanguageMode,
        chars: safeTTS.text.length,
        truncated: safeTTS.truncated,
      });

      const googleResult = await generateGoogleSinhalaSpeech({
        text: safeTTS.text,
        outputPath,
      });

      audioBytes = googleResult.audioBytes;
      chunkCount = googleResult.chunkCount;
    } else {
      console.log("ElevenLabs TTS:", {
        provider,
        languageMode: selectedLanguageMode,
        voiceId,
        modelId,
        chars: safeTTS.text.length,
        truncated: safeTTS.truncated,
      });

      audioBytes = await generateElevenLabsSpeech({
        text: safeTTS.text,
        languageMode: selectedLanguageMode,
        outputPath,
        voiceId,
        modelId,
      });
    }

    const durationMs = estimateDurationMs(safeTTS.text);
    const visemes = visemeFromText(safeTTS.text, durationMs);

    return res.json({
      ok: true,
      provider,
      cached,
      languageMode: selectedLanguageMode,
      voiceId,
      modelId,
      audioBytes,
      chunkCount,
      truncated: safeTTS.truncated,
      originalLength: safeTTS.originalLength,
      spokenLength: safeTTS.text.length,
      audioUrl: `/output/generated/${fileName}`,
      durationMs,
      visemes,
    });
  } catch (e) {
    console.error("/api/talk TTS error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message || "TTS failed",
    });
  }
});

/*async function generateSpeech(text) {
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
});*/

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