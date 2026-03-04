import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { OpenAI } from "openai";
import Explanation from "../models/Explanation.js";

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

/**
 * Builds the common base messages (RAG or non-RAG) WITHOUT style.
 * Then we inject style per mode.
 */
async function buildBasePrompt({ message, strict }) {
  if (!strict) {
    return {
      systemBase: `
You are an explanation generator for university students.

Follow the requested explanation style strictly.
Do not introduce yourself.
Keep the answer academically useful and clear.
      `.trim(),
      userMessage: message,
    };
  }

  // STRICT MODE => RAG retrieval
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
You are an academic explanation generator.

STRICT RULES:
- Use ONLY the provided context
- Do NOT add outside knowledge
- Do NOT introduce yourself
- If the answer is not supported by context, say so briefly
- Follow the explanation style carefully

CONTEXT:
${context || "(No context available)"}
    `.trim(),
    userMessage: message,
  };
}

/**
 * Generates one mode using shared base prompt.
 */
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

    const selectedMode = normalizeMode(mode);
    const cleanMessage = String(message).trim();

    // Build shared prompt base once (includes RAG retrieval if strict)
    const basePrompt = await buildBasePrompt({
      message: cleanMessage,
      strict: Boolean(strict),
    });

    // ✅ 1) Generate selected mode first (priority)
    const selectedAnswer = await generateForMode({
      message: cleanMessage,
      strict: Boolean(strict),
      mode: selectedMode,
      basePrompt,
    });

    // ✅ 2) Generate remaining modes
    const remainingModes = ALL_MODES.filter((m) => m !== selectedMode);

    // Parallel generation for speed
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

    // Build all views object
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

    // ✅ Backward-compatible answer = selected view answer
    const doc = await Explanation.create({
      question: cleanMessage,
      title: generateTitle(cleanMessage),
      mode: selectedMode,
      instruction: MODE_INSTRUCTIONS[selectedMode],
      answer: selectedAnswer,
      views,
      strict: Boolean(strict),
    });

    return res.json({
      id: doc._id,
      mode: selectedMode, // selected mode
      content: selectedAnswer, // backward-compatible current frontend
      answer: selectedAnswer, // extra alias
      views, // ✅ all views for instant switching
      question: cleanMessage,
      title: doc.title,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Generation failed" });
  }
}
