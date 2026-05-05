const SUPPORTED_LANGUAGE_MODES = ["english", "sinhala", "singlish"];

function normalizeLanguageMode(languageMode) {
  const mode = String(languageMode || "english").toLowerCase().trim();
  return SUPPORTED_LANGUAGE_MODES.includes(mode) ? mode : "english";
}

function getLanguageLabel(languageMode) {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") return "Sinhala";
  if (mode === "singlish") return "Singlish";
  return "English";
}

function getLanguageSystemPrompt(languageMode) {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return `
You are a friendly AI tutor.

Language mode: Sinhala.

Rules:
- Reply mainly in natural Sinhala.
- Use simple Sinhala suitable for students.
- Explain step by step.
- If there is an English technical term, you may include it in brackets.
- Keep answers clear, supportive, and educational.
- Ask follow-up questions when useful.
- Add short encouragement when the student seems confused.
`;
  }

  if (mode === "singlish") {
    return `
You are a friendly AI tutor.

Language mode: Singlish.

Rules:
- Reply in simple Singlish using English letters.
- You may mix simple English words with Sinhala-style explanation.
- Do not use complex Sinhala script unless the user asks for it.
- Explain step by step.
- Keep the tone friendly and motivational.
- Example style:
  "Hari, api meka step by step balamu."
  "Meka lesi widihata kiyannam."
  "Oyata me concept eka therum ganna puluwan."
`;
  }

  return `
You are a friendly AI tutor.

Language mode: English.

Rules:
- Reply in clear, simple English.
- Explain step by step.
- Use student-friendly examples.
- Keep answers supportive and educational.
- Ask follow-up questions when useful.
- Add short encouragement when the student seems confused.
`;
}

function buildLessonPrompt({
  languageMode = "english",
  topic = "",
  docContext = "",
  chatHistory = [],
  userMessage = "",
}) {
  const mode = normalizeLanguageMode(languageMode);
  const systemPrompt = getLanguageSystemPrompt(mode);

  const safeTopic = topic || "Current lesson topic";
  const safeDocContext = docContext || "No document context provided.";

  const recentHistory = Array.isArray(chatHistory)
    ? chatHistory
        .slice(-10)
        .map((m) => {
          const role = m.role || m.sender || "user";
          const text = m.text || "";
          return `${role}: ${text}`;
        })
        .join("\n")
    : "";

  return `
${systemPrompt}

Current lesson topic:
${safeTopic}

Document / lesson context:
${safeDocContext}

Recent conversation:
${recentHistory || "No previous messages in this session."}

Student message:
${userMessage}

Tutor response:
`;
}

function getTTSVoiceConfig(languageMode) {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return {
      languageCode: "si-LK",
      voiceName: "si-LK-standard",
      fallbackLanguageCode: "si-LK",
      speakingRate: 0.95,
    };
  }

  if (mode === "singlish") {
    return {
      languageCode: "en-US",
      voiceName: "en-US-standard",
      fallbackLanguageCode: "en-US",
      speakingRate: 0.92,
    };
  }

  return {
    languageCode: "en-US",
    voiceName: "en-US-standard",
    fallbackLanguageCode: "en-US",
    speakingRate: 1.0,
  };
}

function getMotivationText(languageMode) {
  const mode = normalizeLanguageMode(languageMode);

  if (mode === "sinhala") {
    return "හොඳයි, අපි මේක ටික ටික ලේසි කරගමු.";
  }

  if (mode === "singlish") {
    return "Hari, api meka tika tika lesi karagamu. Oyata puluwan.";
  }

  return "You’re doing well. Let’s go one step at a time.";
}

module.exports = {
  SUPPORTED_LANGUAGE_MODES,
  normalizeLanguageMode,
  getLanguageLabel,
  getLanguageSystemPrompt,
  buildLessonPrompt,
  getTTSVoiceConfig,
  getMotivationText,
};