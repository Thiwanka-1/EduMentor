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

const CLASSIFIER_API_URL =
  process.env.CLASSIFIER_API_URL || "http://127.0.0.1:8002";
const RAG_API_URL = process.env.RAG_API_URL || "http://127.0.0.1:8001";
const CLASSIFIER_THRESHOLD = Number(process.env.CLASSIFIER_THRESHOLD || 0.8);

const CLASSIFIER_TIMEOUT_MS = Number(process.env.CLASSIFIER_TIMEOUT_MS || 4000);
const RAG_TIMEOUT_MS = Number(process.env.RAG_TIMEOUT_MS || 8000);

function generateTitle(question) {
  return question.split(" ").slice(0, 6).join(" ");
}

function normalizeMode(mode) {
  return ALL_MODES.includes(mode) ? mode : "simple";
}

function complexityLabel(level = 55) {
  const n = Number(level);
  if (Number.isNaN(n)) return "Undergraduate";
  if (n <= 30) return "Novice";
  if (n <= 70) return "Undergraduate";
  return "Advanced";
}

function complexityRules(label) {
  if (label === "Novice") {
    return `- Use very simple wording
- Avoid heavy jargon
- Give 1 small example
- Keep answers short and clear`;
  }
  if (label === "Advanced") {
    return `- Use deeper technical detail
- Include edge cases and formal terms
- Include 1–2 concise examples
- Use structured headings`;
  }
  return `- Balanced explanation
- Include key terms
- Include 1 example
- Keep it exam-friendly`;
}

function buildFriendlyOutOfScopeContent() {
  return `### This question is outside MVEG's academic scope

MVEG is designed for **Computer Science, Software Engineering, and IT learning support**.

Your current question does not appear to belong to that academic scope, so I cannot generate an explanation for it here.

**How to ask a better question**
- Ask about programming, databases, networking, operating systems, software engineering, AI/ML, or web topics.
- Try academic prompts like **explain**, **compare**, **summarize**, or **give an example**.
- If your question is technical, include the subject or module name.

**Try one of these instead**
- Explain polymorphism in Java
- Compare TCP and UDP
- What is normalization in DBMS?
- Explain binary search tree with an example`;
}

function buildDegradedWarnings(degraded, strictRequested) {
  const warnings = [];

  if (degraded.classifier) {
    warnings.push(
      "Academic scope checking is temporarily unavailable, so this answer was generated without classifier validation.",
    );
  }

  if (degraded.rag && strictRequested) {
    warnings.push(
      "Strict syllabus retrieval is temporarily unavailable, so this answer was generated without syllabus-grounded context.",
    );
  }

  return warnings;
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function classifyWithModel(message) {
  const result = await fetchJsonWithTimeout(
    `${CLASSIFIER_API_URL}/classify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    },
    CLASSIFIER_TIMEOUT_MS,
  );

  if (!result.ok) {
    throw new Error(`Classifier API failed with status ${result.status}`);
  }

  const data = result.data || {};

  return {
    label: data.label,
    inScopeConfidence: Number(data.in_scope_confidence || 0),
    outScopeConfidence: Number(data.out_of_scope_confidence || 0),
    threshold: Number(data.threshold || CLASSIFIER_THRESHOLD),
  };
}

async function retrieveContext({ message, module }) {
  const result = await fetchJsonWithTimeout(
    `${RAG_API_URL}/retrieve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        top_k: 5,
        module: module || "ALL",
      }),
    },
    RAG_TIMEOUT_MS,
  );

  if (!result.ok) {
    throw new Error(`RAG API failed with status ${result.status}`);
  }

  return Array.isArray(result.data) ? result.data : [];
}

async function buildBasePrompt({
  message,
  strict,
  module = "ALL",
  complexity = 55,
  degraded,
}) {
  const level = complexityLabel(complexity);
  const rules = complexityRules(level);

  if (!strict) {
    return {
      systemBase: `
You are an explanation generator for university students focused on CS/SE/IT academic topics.

COMPLEXITY LEVEL: ${level}
RULES:
${rules}

Follow the requested explanation style strictly.
Do not introduce yourself.
Keep the answer academically useful, clear, and syllabus-friendly.
      `.trim(),
      userMessage: message,
    };
  }

  try {
    const chunks = await retrieveContext({ message, module });

    const context = chunks
      .map((c, i) => {
        const src = c.source || "unknown";
        const pg = c.page ? `, page ${c.page}` : "";
        return `Source ${i + 1} (${src}${pg}):\n${c.text || ""}`;
      })
      .join("\n\n");

    return {
      systemBase: `
You are an academic explanation generator for CS/SE/IT students.

STRICT RULES:
- Use ONLY the provided context
- Do NOT add outside knowledge
- Do NOT introduce yourself
- If the answer is not supported by context, say: "Not found in provided materials."
- Stay within syllabus content
- Cite sources like (source: file, page n) when possible

COMPLEXITY LEVEL: ${level}
RULES:
${rules}

CONTEXT:
${context || "(No context available)"}
      `.trim(),
      userMessage: message,
    };
  } catch (err) {
    console.error("RAG service error:", err.message);
    degraded.rag = true;

    // fallback to normal explanation if strict retrieval fails
    return {
      systemBase: `
You are an explanation generator for university students focused on CS/SE/IT academic topics.

COMPLEXITY LEVEL: ${level}
RULES:
${rules}

IMPORTANT:
- Strict syllabus retrieval was unavailable.
- Generate the best possible general academic explanation.
- Do not claim that this came from syllabus materials.
- Do not introduce yourself.
      `.trim(),
      userMessage: message,
    };
  }
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
    const {
      message,
      mode = "simple",
      strict = false,
      module = "ALL",
      complexity = 55,
    } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ error: "Not authorized" });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Message required" });
    }

    const cleanMessage = String(message).trim();
    const selectedMode = normalizeMode(mode);

    const degraded = {
      classifier: false,
      rag: false,
    };

    /* =========================
       1) classifier gate
    ========================= */
    let allowGeneration = true;
    let classifierMeta = null;

    try {
      const cls = await classifyWithModel(cleanMessage);
      classifierMeta = cls;

      const allowed =
        cls.label === "in_scope" &&
        cls.inScopeConfidence >= (cls.threshold || CLASSIFIER_THRESHOLD);

      allowGeneration = allowed;

      if (!allowed) {
        return res.status(200).json({
          id: null,
          mode: selectedMode,
          content: buildFriendlyOutOfScopeContent(),
          answer: "Out of scope",
          views: {
            simple: "",
            analogy: "",
            code: "",
            summary: "",
          },
          outOfScope: true,
          outOfScopePayload: {
            classifierSource: "trained_classifier",
            classifierConfidence: cls.inScopeConfidence,
            classifierRaw: cls,
          },
          question: cleanMessage,
          title: "Out of scope request",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Classifier service error:", err.message);
      degraded.classifier = true;
      allowGeneration = true; // fail-open
    }

    if (!allowGeneration) {
      return res.status(200).json({
        id: null,
        mode: selectedMode,
        content: buildFriendlyOutOfScopeContent(),
        answer: "Out of scope",
        views: {
          simple: "",
          analogy: "",
          code: "",
          summary: "",
        },
        outOfScope: true,
        question: cleanMessage,
        title: "Out of scope request",
        createdAt: new Date().toISOString(),
      });
    }

    /* =========================
       2) build prompt with possible RAG fallback
    ========================= */
    const basePrompt = await buildBasePrompt({
      message: cleanMessage,
      strict: Boolean(strict),
      module,
      complexity,
      degraded,
    });

    /* =========================
       3) generate selected view
    ========================= */
    const selectedAnswer = await generateForMode({
      message: cleanMessage,
      strict: Boolean(strict && !degraded.rag),
      mode: selectedMode,
      basePrompt,
    });

    /* =========================
       4) generate remaining views
    ========================= */
    const remainingModes = ALL_MODES.filter((m) => m !== selectedMode);

    const remainingResults = await Promise.all(
      remainingModes.map(async (m) => {
        const content = await generateForMode({
          message: cleanMessage,
          strict: Boolean(strict && !degraded.rag),
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

    const doc = await Explanation.create({
      user: req.user._id,
      question: cleanMessage,
      title: generateTitle(cleanMessage),
      mode: selectedMode,
      instruction: MODE_INSTRUCTIONS[selectedMode],
      answer: selectedAnswer,
      views,
      strict: Boolean(strict && !degraded.rag),
      module,
      complexity,
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
      module,
      complexity,
      degraded,
      warnings: buildDegradedWarnings(degraded, strict),
      classifierSource: degraded.classifier
        ? "classifier_unavailable_fallback_open"
        : "trained_classifier",
      classifierConfidence: classifierMeta?.inScopeConfidence ?? null,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({
      error: "Generation failed",
      message:
        "MVEG could not generate an explanation right now. Please try again in a moment.",
    });
  }
}
