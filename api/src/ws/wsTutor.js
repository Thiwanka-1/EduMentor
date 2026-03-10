import { getTutorResponse } from "../services/aiModelService.js";
import { generateAudioAndVisemes } from "../services/ttsService.js";
import { getSession, removeSession } from "../services/sessionService.js";

export default function tutorWSConnection(ws, sessionId) {

  const session = getSession(sessionId);
  if (!session) {
    ws.send(JSON.stringify({ error: "Invalid session" }));
    ws.close();
    return;
  }

  session.ws = ws;
  console.log("🎧 Tutor Connected:", sessionId);

  ws.on("message", async (rawData) => {
    let data = null;

    try {
      data = JSON.parse(rawData.toString());
      console.log("📥 Incoming:", data);
    } catch {
      ws.send(JSON.stringify({ type: "error", msg: "Invalid JSON" }));
      return;
    }

    // ------------------------------------------------
    // 🧠 Student ASK Message
    // ------------------------------------------------
    if (data.type === "ask") {
      const question = data.question || "";
      console.log("🎓 Student Asked:", question);

      // 1️⃣ LLM RESPONSE
      const textAnswer = await getTutorResponse(question);

      console.log("📝 LLM Answer:", textAnswer.substring(0, 80), "...");

      ws.send(JSON.stringify({
        type: "text",
        text: textAnswer
      }));

      // 2️⃣ TTS (Piper)
      console.log("🔊 [TTS] Calling Piper with text length:", textAnswer.length);

      try {
        const audio = await generateAudioAndVisemes(textAnswer);

        console.log("🎵 [TTS] Piper returned audio length:", audio.audioBase64?.length);
        console.log("👄 [TTS] Viseme count:", audio.visemes?.length);

        if (!audio.audioBase64 || audio.audioBase64.length < 10) {
          console.error("❌ [TTS] Audio is empty or invalid");
          ws.send(JSON.stringify({
            type: "error",
            msg: "TTS generated empty audio"
          }));
          return;
        }

        console.log("🎤 Sending audio + visemes to frontend");


        // 3️⃣ SEND AUDIO + VISEMES TO FRONTEND
        ws.send(JSON.stringify({
          type: "audio",
          audio: audio.audioBase64,
          visemes: audio.visemes
        }));

        console.log("📤 [WS] Sent audio+visemes to client.");

      } catch (err) {
        console.error("❌ Piper Error:", err);
        ws.send(JSON.stringify({
          type: "error",
          msg: "Piper TTS failed"
        }));
      }

      return;
    }

    // ------------------------------------------------
    // UNKNOWN COMMAND
    // ------------------------------------------------
    ws.send(JSON.stringify({
      type: "ack",
      received: data,
      msg: "Unknown command"
    }));

  });

  ws.on("close", () => {
    console.log("👋 Tutor Closed:", sessionId);
    removeSession(sessionId);
  });
}
