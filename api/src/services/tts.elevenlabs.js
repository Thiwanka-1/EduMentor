import fs from "fs";
import path from "path";

function estimateDurationMs(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length || 1;
  const sec = words / 2.3; // ~140 wpm
  return Math.max(1200, Math.round(sec * 1000));
}

// Node 18+ has global fetch. If not, uncomment next line:
// import fetch from "node-fetch";

export async function elevenLabsTTS(text, { outDir }) {
  fs.mkdirSync(outDir, { recursive: true });

  const id = Date.now().toString();
  const outPath = path.join(outDir, `${id}.mp3`);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID; // must be a premade voice id you have access to
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY in .env");
  if (!voiceId) throw new Error("Missing ELEVENLABS_VOICE_ID in .env");

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      // keep minimal so it works across accounts
      // model_id: "eleven_multilingual_v2"
    })
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${resp.status}): ${errText.slice(0, 300)}`);
  }

  const arrayBuffer = await resp.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(arrayBuffer));

  return {
    id,
    audioUrl: `/generated/${id}.mp3`,
    durationMs: estimateDurationMs(text)
  };
}
