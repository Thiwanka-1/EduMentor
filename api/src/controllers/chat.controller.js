import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { OpenAI } from "openai";
import Explanation from "../models/Explanation.js";
import {
  evaluateAcademicScope,
  buildOutOfScopeMessage,
} from "../utils/domainGuard.js";

const ALL_MODES = ["simple", "analogy", "code", "summary"];

const MODE_INSTRUCTIONS = {
  simple:
    "Explain very simply for a beginner student. Use short sentences. Avoid jargon.",
  analogy:
    "Explain using real-world analogies and examples. Keep it intuitive.",
  code: "Explain with clear code examples where applicable. Add small snippets and explain them.",
  summary: "Give a concise bullet-point summary. Max 8 bullets.",
};

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

function generateTitle(question) {
  return question.split(" ").slice(0, 6).join(" ");
}

function normalizeMode(mode) {
  return ALL_MODES.includes(mode) ? mode : "simple";
}

async function classifyAcademicScopeWithLLM(message) {
  // short cheap classifier call for ambiguous cases only
  try {
    const completion = await client.chat.completions.create({
      model: process.env.HF_MODEL,
      messages: [
        {
          role: "system",
          content: `
You are a strict query classifier for an academic learning system.

Classify the user query into ONE label only:
- ACADEMIC_CS_IT (Computer Science / Software Engineering / Information Technology academic topic)
- ACADEMIC_NON_CS (academic but outside CS/SE/IT scope)
- NON_ACADEMIC (general life, entertainment, unrelated topic)

Rules:
- Return ONLY the label, no explanation.
          `.trim(),
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const label = (completion?.choices?.[0]?.message?.content || "")
      .trim()
      .toUpperCase();

    if (
      label === "ACADEMIC_CS_IT" ||
      label === "ACADEMIC_NON_CS" ||
      label === "NON_ACADEMIC"
    ) {
      return label;
    }

    return "NON_ACADEMIC"; // safe fallback
  } catch (e) {
    console.error("LLM scope classifier failed:", e.message);
    return "NON_ACADEMIC"; // safe fallback
  }
}

async function buildBasePrompt({ message, strict }) {
  if (!strict) {
    return {
      systemBase: `
You are an explanation generator for university students focused on CS/SE/IT academic topics.

Follow the requested explanation style strictly.
Do not introduce yourself.
Keep the answer academically useful, clear, and syllabus-friendly.
      `.trim(),
      userMessage: message,
    };
  }

  const retrievalRes = await fetch("http://localhost:8001/retrieve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: message,
      top_k: 3,
    }),
  });

  if (!retrievalRes.ok) {
    throw new Error("Retrieval failed");
  }

  const chunks = await retrievalRes.json();

  const context = (Array.isArray(chunks) ? chunks : [])
    .map(
      (c, i) => `Source ${i + 1} (${c.source || "unknown"}):\n${c.text || ""}`,
    )
    .join("\n\n");

  return {
    systemBase: `
You are an academic explanation generator for CS/SE/IT students.

STRICT RULES:
- Use ONLY the provided context
- Do NOT add outside knowledge
- Do NOT introduce yourself
- If the answer is not supported by context, say so briefly
- Follow the explanation style carefully
- Stay within academic/syllabus content

CONTEXT:
${context || "(No context available)"}
    `.trim(),
    userMessage: message,
  };
}

async function generateForMode({ message, strict, mode, basePrompt }) {
  const styleInstruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.simple;

  const messages = [
    {
      role: "system",
      content: `${basePrompt.systemBase}

EXPLANATION STYLE:
${styleInstruction}`,
    },
    {
      role: "user",
      content: basePrompt.userMessage || message,
    },
  ];

  const completion = await client.chat.completions.create({
    model: process.env.HF_MODEL,
    messages,
    max_tokens: 650,
    temperature: strict ? 0.4 : 0.7,
  });

  return (completion?.choices?.[0]?.message?.content || "").trim();
}

export async function generateAndSave(req, res) {
  try {
    const { message, mode = "simple", strict = false } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Message required" });
    }

    const cleanMessage = String(message).trim();
    const selectedMode = normalizeMode(mode);

    /* ==================================================
       ✅ 1) DOMAIN GUARD (Rule-based first)
       ================================================== */
    const ruleCheck = evaluateAcademicScope(cleanMessage);

    let allowed = ruleCheck.allowed;

    // Ambiguous => use LLM classifier fallback
    if (allowed === null) {
      const label = await classifyAcademicScopeWithLLM(cleanMessage);
      allowed = label === "ACADEMIC_CS_IT";
    }

    if (!allowed) {
      // Friendly out-of-scope response (UX-focused)
      const payload = buildOutOfScopeMessage(cleanMessage);

      // We do NOT save out-of-scope requests in explanations collection
      return res.status(200).json({
        id: null,
        mode: selectedMode,
        content: `### Out of MVEG Academic Scope\n\n${payload.message}\n\n**Try asking something like:**\n- ${payload.examples.join("\n- ")}`,
        answer: `Out of scope`,
        views: {
          simple: "",
          analogy: "",
          code: "",
          summary: "",
        },
        outOfScope: true,
        outOfScopePayload: payload,
        question: cleanMessage,
        title: "Out of scope request",
        createdAt: new Date().toISOString(),
      });
    }

    /* ==================================================
       ✅ 2) BUILD PROMPT BASE ONCE (RAG / non-RAG)
       ================================================== */
    const basePrompt = await buildBasePrompt({
      message: cleanMessage,
      strict: Boolean(strict),
    });

    /* ==================================================
       ✅ 3) GENERATE SELECTED VIEW FIRST
       ================================================== */
    const selectedAnswer = await generateForMode({
      message: cleanMessage,
      strict: Boolean(strict),
      mode: selectedMode,
      basePrompt,
    });

    /* ==================================================
       ✅ 4) GENERATE REMAINING VIEWS
       ================================================== */
    const remainingModes = ALL_MODES.filter((m) => m !== selectedMode);

    const remainingResults = await Promise.all(
      remainingModes.map(async (m) => {
        const content = await generateForMode({
          message: cleanMessage,
          strict: Boolean(strict),
          mode: m,
          basePrompt,
        });
        return [m, content];
      }),
    );

    const views = {
      simple: "",
      analogy: "",
      code: "",
      summary: "",
      [selectedMode]: selectedAnswer,
    };

    for (const [m, content] of remainingResults) {
      views[m] = content;
    }

    /* ==================================================
       ✅ 5) SAVE ONE DOCUMENT WITH ALL VIEWS
       ================================================== */
    const doc = await Explanation.create({
      question: cleanMessage,
      title: generateTitle(cleanMessage),
      mode: selectedMode,
      instruction: MODE_INSTRUCTIONS[selectedMode],
      answer: selectedAnswer, // backward-compatible
      views,
      strict: Boolean(strict),
    });

    return res.json({
      id: doc._id,
      mode: selectedMode,
      content: selectedAnswer,
      answer: selectedAnswer,
      views,
      outOfScope: false,
      question: cleanMessage,
      title: doc.title,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Generation failed" });
  }
}
