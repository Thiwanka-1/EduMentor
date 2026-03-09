// backend/ws/wsLesson.js
import { getDoc } from "../services/slidesService.js";
import { runLessonCommand } from "../services/lessonService.js";

function safeSend(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

export default function lessonWSConnection(ws, sessionId) {
  console.log("📘 Lesson Connected:", sessionId);

  const state = {
    docId: null,
    docText: "",
    lastAnswer: "",
    lastSpeech: "",
    lastAudio: null,
    lastVisemes: [],
    jobId: 0, // used to cancel old runs
  };

  safeSend(ws, { type: "status", value: "idle" });

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString("utf8"));
    } catch {
      return safeSend(ws, { type: "error", msg: "Invalid JSON" });
    }

    // ------------------------------------------------
    // INIT (after upload)
    // ------------------------------------------------
    if (msg.type === "init") {
      const docId = String(msg.docId || "");
      const doc = getDoc(docId);
      if (!doc) return safeSend(ws, { type: "error", msg: "docId not found. Upload first." });

      state.docId = docId;
      state.docText = doc.text || "";
      state.lastAnswer = "";
      state.lastSpeech = "";
      state.lastAudio = null;
      state.lastVisemes = [];

      safeSend(ws, { type: "status", value: "idle" });
      return safeSend(ws, {
        type: "text",
        text: `✅ Lesson loaded: ${doc.filename}\n(Extracted ${state.docText.length} chars)`,
      });
    }

    // ------------------------------------------------
    // STOP (cancel any ongoing run)
    // ------------------------------------------------
    if (msg.type === "stop") {
      state.jobId++; // invalidate in-flight jobs
      safeSend(ws, { type: "status", value: "idle" });
      return safeSend(ws, { type: "text", text: "🛑 Stopped." });
    }

    // ------------------------------------------------
    // CMD: start / explain_more / example / summarize / diagnose
    // ------------------------------------------------
    if (msg.type === "cmd") {
      if (!state.docId) return safeSend(ws, { type: "error", msg: "Upload + init first." });

      const cmd = String(msg.cmd || "").trim();
      if (!cmd) return safeSend(ws, { type: "error", msg: "Missing cmd" });

      // allow frontend Repeat without re-generating
      if (cmd === "repeat") {
        if (!state.lastAudio) return safeSend(ws, { type: "text", text: "ℹ️ Nothing to repeat yet. Press Start." });

        safeSend(ws, { type: "audio", audio: state.lastAudio, visemes: state.lastVisemes });
        return;
      }

      const myJob = ++state.jobId;

      safeSend(ws, { type: "status", value: "thinking" });

      try {
        const result = await runLessonCommand({
          cmd,
          docText: state.docText,
          lastAnswer: state.lastAnswer,
        });

        // If STOP happened during work, ignore output
        if (myJob !== state.jobId) return;

        // store last answer for Explain More / Diagnose
        state.lastAnswer = result.answerText || "";

        // cache repeat
        state.lastSpeech = result.speechText || "";
        state.lastAudio = result.audioBase64 || null;
        state.lastVisemes = Array.isArray(result.visemes) ? result.visemes : [];

        safeSend(ws, { type: "text", text: state.lastAnswer });

        safeSend(ws, {
          type: "audio",
          audio: state.lastAudio,
          visemes: state.lastVisemes,
        });

        safeSend(ws, { type: "status", value: "idle" });
      } catch (e) {
        if (myJob !== state.jobId) return;
        console.error("Lesson cmd error:", e);
        safeSend(ws, { type: "status", value: "idle" });
        safeSend(ws, { type: "error", msg: e.message || "Lesson failed" });
      }
      return;
    }

    safeSend(ws, { type: "error", msg: `Unknown message type: ${msg.type}` });
  });

  ws.on("close", () => {
    console.log("👋 Lesson Closed:", sessionId);
  });
}
