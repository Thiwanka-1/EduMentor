// backend/services/talkService.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const OUTPUT_DIR = "./output";
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

export async function generateSpeechElevenLabs(text, { apiKey, voiceId }) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error("ElevenLabs failed: " + err);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const audioPath = path.join(OUTPUT_DIR, `audio_${Date.now()}.wav`);
  fs.writeFileSync(audioPath, audioBuffer);
  return audioPath;
}

/**
 * ✅ Replace this with YOUR current Piper+viseme method
 * It must return: { audioUrl, visemes }
 *
 * audioUrl must be a URL your frontend can load, e.g. "/output/audio_x.wav"
 */
export async function talkToAudioAndVisemes(text, deps) {
  // deps = { ELEVEN_API_KEY, ELEVEN_VOICE_ID, makeVisemesFromAudio, ... }

  // 1) Generate audio (ElevenLabs example)
  const audioPath = await generateSpeechElevenLabs(text, {
    apiKey: deps.ELEVEN_API_KEY,
    voiceId: deps.ELEVEN_VOICE_ID,
  });

  // 2) Make visemes (you already have this in your WS / STT pipeline)
  // This must return [{ t: 0.12, v: "AA" }, ...] or your format
  const visemes = await deps.makeVisemesFromAudio(audioPath);

  // 3) Convert file path to static URL served by Express
  const audioUrl = "/" + audioPath.replace(/\\/g, "/"); // "./output/xx.wav" -> "/./output/xx.wav"
  // safer:
  const safeUrl = audioUrl.replace("/./", "/"); // "/output/xx.wav"

  return { audioUrl: safeUrl, visemes };
}
