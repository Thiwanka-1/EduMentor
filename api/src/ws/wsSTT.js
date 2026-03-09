// backend/ws/sttWS.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
//import { pipeline } from "@xenova/whisper-tiny.en";
import { pipeline } from "@xenova/transformers"; // ✅ Correct
// Base64 → Buffer helper
function base64ToBuffer(base64) {
  return Buffer.from(base64, "base64");
}

let whisper = null;

// Load Whisper model only once
async function loadModel() {
  if (!whisper) {
    console.log("🔄 Loading Whisper Tiny model...");
    whisper = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
    console.log("✅ Whisper Model Loaded");
  }
  return whisper;
}

export default async function sttWS(ws) {
  console.log("🎤 STT WebSocket Connected");

  const model = await loadModel();

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "audio_chunk") {
        // Convert base64 audio into binary
        const audioBuffer = base64ToBuffer(data.audio);

        // Save temporary WebM file
        const filePath = "./temp_audio.webm";
        fs.writeFileSync(filePath, audioBuffer);

        console.log("🎧 Received audio chunk → running Whisper...");

        // Run Whisper ASR
        const result = await model(filePath);

        console.log("📝 Whisper Transcript:", result.text);

        // Send transcript back to frontend
        ws.send(
          JSON.stringify({
            type: "transcript",
            text: result.text,
          })
        );
      }
    } catch (err) {
      console.error("❌ STT Error:", err);
      ws.send(JSON.stringify({ type: "error", message: err.message }));
    }
  });

  ws.on("close", () => {
    console.log("🔌 STT WebSocket Disconnected");
  });
}
