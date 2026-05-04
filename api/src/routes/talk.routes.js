import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { elevenLabsTTS } from "../services/tts.elevenlabs.js";
import { visemeFromText } from "../utils/visemeFromText.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /api/talk
router.post("/talk", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ ok: false, error: "text required" });

    const outDir = path.join(__dirname, "..", "output", "generated"); // matches your backend structure
    const { audioUrl, durationMs } = await elevenLabsTTS(text, { outDir });

    const visemes = visemeFromText(text, durationMs);

    return res.json({ ok: true, audioUrl, durationMs, visemes });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "Talk failed" });
  }
});

export default router;
