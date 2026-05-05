import { getTutorResponse } from "../services/aiModelService.js";
import { generateAudioAndVisemes } from "../services/ttsService.js";
import { getSession, removeSession } from "../services/sessionService.js";

const SUPPORTED_LANGUAGE_MODES = ["english", "sinhala", "singlish", "tamil"];

function normalizeLanguageMode(languageMode = "english") {
  const mode = String(languageMode || "english").toLowerCase().trim();
  return SUPPORTED_LANGUAGE_MODES.includes(mode) ? mode : "english";
}

function buildTutorPrompt({
  question = "",
  languageMode = "english",
  history = [],
}) {
  const mode = normalizeLanguageMode(languageMode);

  const recentHistory = Array.isArray(history)
    ? history
        .slice(-8)
        .map((m) => {
          const role = String(m.role || "user").toUpperCase();
          const text = String(m.text || "").trim();
          return `${role}: ${text}`;
        })
        .join("\n")
    : "";

  const languageRules =
    mode === "sinhala"
      ? `
Language mode: Sinhala
Rules:
- Reply in natural Sinhala script.
- Do not reply in English unless a technical term is needed.
- Be friendly and student-friendly.
- If the student only greets you, reply naturally. Do not explain the greeting.
`
      : mode === "tamil"
      ? `
Language mode: Tamil
Rules:
- Reply in natural Tamil script.
- Do not reply in English unless a technical term is needed.
- Be friendly and student-friendly.
- If the student only greets you, reply naturally. Do not explain the greeting.
`
      : mode === "singlish"
      ? `
Language mode: Singlish
Rules:
- Reply in easy Singlish using English letters.
- Do not use Sinhala script.
- Be friendly and student-friendly.
- If the student only greets you, reply naturally. Do not explain the greeting.
`
      : `
Language mode: English
Rules:
- Reply in clear, simple English.
- Be friendly and student-friendly.
- If the student only greets you, reply naturally. Do not explain the greeting.
`;

  return `
You are a friendly university AI tutor.

${languageRules}

Friendly tutor behavior:
- Do not act like only a lesson generator.
- If the student says "hi", "hello", "hey", or casual small talk, reply warmly and ask how you can help.
- If the student asks for a topic, explanation, example, lesson, quiz, or summary, teach clearly.
- If the student says "more", "continue", "explain more", or "give example", continue from recent conversation history.
- Avoid very long paragraphs.
- Give the final tutor answer only.

Recent conversation:
${recentHistory || "No previous history."}

Student question:
${question}

Now generate the tutor response.
`.trim();
}

export default function tutorWSConnection(ws, sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    ws.send(
      JSON.stringify({
        type: "error",
        msg: "Invalid session",
      })
    );
    ws.close();
    return;
  }

  session.ws = ws;
  session.messages = Array.isArray(session.messages) ? session.messages : [];
  session.languageMode = normalizeLanguageMode(session.languageMode || "english");

  console.log("🎧 Tutor Connected:", sessionId);

  ws.on("message", async (rawData) => {
    let data = null;

    try {
      data = JSON.parse(rawData.toString());
      console.log("📥 Tutor WS Incoming:", data);
    } catch {
      ws.send(
        JSON.stringify({
          type: "error",
          msg: "Invalid JSON",
        })
      );
      return;
    }

    if (data.type === "init") {
      const selectedLanguageMode = normalizeLanguageMode(
        data.languageMode || session.languageMode || "english"
      );

      session.languageMode = selectedLanguageMode;

      ws.send(
        JSON.stringify({
          type: "status",
          status: "ready",
          languageMode: selectedLanguageMode,
          sessionId,
        })
      );

      return;
    }

    if (data.type === "stop") {
      ws.send(
        JSON.stringify({
          type: "status",
          status: "stopped",
          sessionId,
        })
      );

      return;
    }

    if (data.type === "ask") {
      const question = String(data.question || data.message || "").trim();

      if (!question) {
        ws.send(
          JSON.stringify({
            type: "error",
            msg: "Question is required",
          })
        );
        return;
      }

      const selectedLanguageMode = normalizeLanguageMode(
        data.languageMode || session.languageMode || "english"
      );

      session.languageMode = selectedLanguageMode;

      console.log("🎓 Student Asked:", {
        question,
        languageMode: selectedLanguageMode,
      });

      session.messages.push({
        role: "user",
        text: question,
        languageMode: selectedLanguageMode,
        timestamp: new Date(),
      });

      ws.send(
        JSON.stringify({
          type: "status",
          status: "thinking",
          languageMode: selectedLanguageMode,
        })
      );

      try {
        const prompt = buildTutorPrompt({
          question,
          languageMode: selectedLanguageMode,
          history: session.messages,
        });

        const textAnswer = await getTutorResponse(prompt);

        const cleanAnswer = String(textAnswer || "").trim();

        if (!cleanAnswer) {
          throw new Error("AI returned empty answer");
        }

        session.messages.push({
          role: "tutor",
          text: cleanAnswer,
          languageMode: selectedLanguageMode,
          timestamp: new Date(),
        });

        console.log("📝 LLM Answer:", cleanAnswer.substring(0, 120), "...");

        ws.send(
          JSON.stringify({
            type: "text",
            text: cleanAnswer,
            languageMode: selectedLanguageMode,
            sessionId,
          })
        );

        ws.send(
          JSON.stringify({
            type: "status",
            status: "speaking",
            languageMode: selectedLanguageMode,
          })
        );

        try {
          const audio = await generateAudioAndVisemes(cleanAnswer, {
            languageMode: selectedLanguageMode,
          });

          if (!audio?.audioBase64 || audio.audioBase64.length < 10) {
            console.error("❌ [TTS] Audio is empty or invalid");

            ws.send(
              JSON.stringify({
                type: "error",
                msg: "TTS generated empty audio",
              })
            );

            ws.send(
              JSON.stringify({
                type: "status",
                status: "idle",
                languageMode: selectedLanguageMode,
              })
            );

            return;
          }

          ws.send(
            JSON.stringify({
              type: "audio",
              audio: audio.audioBase64,
              visemes: audio.visemes || [],
              languageMode: selectedLanguageMode,
              sessionId,
            })
          );

          ws.send(
            JSON.stringify({
              type: "status",
              status: "idle",
              languageMode: selectedLanguageMode,
            })
          );

          console.log("📤 [Tutor WS] Sent audio + visemes.");
        } catch (ttsError) {
          console.error("❌ TTS Error:", ttsError);

          ws.send(
            JSON.stringify({
              type: "error",
              msg: "TTS failed",
              detail: ttsError?.message || "Unknown TTS error",
            })
          );

          ws.send(
            JSON.stringify({
              type: "status",
              status: "idle",
              languageMode: selectedLanguageMode,
            })
          );
        }
      } catch (aiError) {
        console.error("❌ Tutor AI Error:", aiError);

        ws.send(
          JSON.stringify({
            type: "error",
            msg: "AI tutor response failed",
            detail: aiError?.message || "Unknown AI error",
          })
        );

        ws.send(
          JSON.stringify({
            type: "status",
            status: "idle",
            languageMode: selectedLanguageMode,
          })
        );
      }

      return;
    }

    ws.send(
      JSON.stringify({
        type: "ack",
        received: data,
        msg: "Unknown command",
      })
    );
  });

  ws.on("close", () => {
    console.log("👋 Tutor Closed:", sessionId);
    removeSession(sessionId);
  });

  ws.on("error", (err) => {
    console.error("❌ Tutor WS Error:", err);
  });
}