import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

import { visemeFromText } from "../utils/visemeFromText.js";

const execFileAsync = promisify(execFile);

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function safeTextForPowerShell(text = "") {
  return String(text || "")
    .replace(/`/g, "")
    .replace(/\$/g, "")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

function getApproxDurationMs(text = "") {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = 145;
  const minutes = words / wordsPerMinute;
  return Math.max(1200, Math.round(minutes * 60 * 1000));
}

async function generateWindowsSpeech({ text, outputPath }) {
  const cleanText = safeTextForPowerShell(text);

  if (!cleanText) {
    throw new Error("No text provided for local TTS.");
  }

  const psScript = `
Add-Type -AssemblyName System.Speech;
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$synth.Rate = 0;
$synth.Volume = 100;
$synth.SetOutputToWaveFile("${outputPath.replace(/\\/g, "\\\\")}");
$synth.Speak("${cleanText.replace(/"/g, '\\"')}");
$synth.Dispose();
`;

  await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    psScript,
  ]);
}

// POST /api/talk
router.post("/talk", async (req, res) => {
  try {
    const { text = "", language = "english", languageMode = "" } = req.body;

    const cleanText = String(text || "").trim();

    if (!cleanText) {
      return res.status(400).json({
        ok: false,
        error: "text required",
      });
    }

    const selectedLanguageMode = String(languageMode || language || "english")
      .toLowerCase()
      .trim();

    const outDir = path.join(__dirname, "..", "output", "generated");

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const fileName = `lesson_${Date.now()}_${crypto
      .randomBytes(6)
      .toString("hex")}.wav`;

    const outputPath = path.join(outDir, fileName);

    await generateWindowsSpeech({
      text: cleanText,
      outputPath,
    });

    const durationMs = getApproxDurationMs(cleanText);
    const visemes = visemeFromText(cleanText, durationMs);

    return res.json({
      ok: true,
      provider: "windows-local-tts",
      languageMode: selectedLanguageMode,
      audioUrl: `/output/generated/${fileName}`,
      durationMs,
      visemes,
    });
  } catch (e) {
    console.error("Local Windows TTS error:", e);

    return res.status(500).json({
      ok: false,
      error: e?.message || "Local TTS failed",
    });
  }
});

export default router;