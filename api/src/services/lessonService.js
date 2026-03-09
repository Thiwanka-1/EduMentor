// backend/services/lessonService.js
import { getTutorResponse } from "./aiModelService.js";
import { generateAudioAndVisemes } from "./ttsService.js";

// Build LLM prompt based on button
function makePrompt(cmd, docText, lastAnswer) {
  const context = String(docText || "").slice(0, 7000);

  if (cmd === "start") {
    return `
Teach this document to a student in SIMPLE ENGLISH.

DOCUMENT:
${context}

You must output in this format:
1) Lesson Title
2) 📘 Explanation (simple English)
3) 🧩 Steps (step-by-step)
4) 📝 Examples (2-3)
5) 🎯 Summary (short)

No quizzes.
`.trim();
  }

  if (cmd === "explain_more") {
    return `
Explain MORE with extra details (still simple English).
Make it clearer step-by-step.

PREVIOUS ANSWER:
${String(lastAnswer || "").slice(0, 2500)}

DOCUMENT (reference):
${context}
`.trim();
  }

  if (cmd === "example") {
    return `
Give 3 practical examples from real life.
Explain each example clearly.

DOCUMENT:
${context}

Previous answer (optional):
${String(lastAnswer || "").slice(0, 1800)}
`.trim();
  }

  if (cmd === "summarize") {
    return `
Summarize the document for a student.

Output:
- 6-10 lines summary
- Key takeaways as bullet points

DOCUMENT:
${context}
`.trim();
  }

  if (cmd === "diagnose") {
    return `
Diagnose common student mistakes in this topic.

Provide:
- Common misunderstandings
- Why it happens
- How to avoid it
- Quick checklist

DOCUMENT:
${context}

Previous answer:
${String(lastAnswer || "").slice(0, 2000)}
`.trim();
  }

  return `
Help the student using the document.

DOCUMENT:
${context}
`.trim();
}

// Reduce speaking time: speak only top part, but SHOW FULL TEXT in output box
function makeSpeechText(fullText) {
  const t = String(fullText || "").trim();
  if (!t) return "";

  const lines = t
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  // speak first ~10-12 meaningful lines only
  return lines.slice(0, 12).join(". ").slice(0, 900);
}

export async function runLessonCommand({ cmd, docText, lastAnswer }) {
  const prompt = makePrompt(cmd, docText, lastAnswer);

  // LLM
  const answerText = await getTutorResponse(prompt);

  // shorter speech
  const speechText = makeSpeechText(answerText);

  // Piper TTS (your working function)
  const audio = await generateAudioAndVisemes(speechText || answerText);

  return {
    answerText,
    speechText,
    audioBase64: audio.audioBase64,
    visemes: audio.visemes,
  };
}
