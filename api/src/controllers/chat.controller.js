import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { OpenAI } from "openai";
import Explanation from "../models/Explanation.js";

const MODE_INSTRUCTIONS = {
  simple: "Explain very simply for a beginner student.",
  analogy: "Explain using real-world analogies.",
  code: "Explain with clear code examples where applicable.",
  summary: "Give a concise bullet-point summary.",
};
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});
function generateTitle(question) {
  return question.split(" ").slice(0, 6).join(" ");
}

export async function generateAndSave(req, res) {
  try {
    const { message, mode = "simple", strict = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const styleInstruction =
      MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.simple;

    let messages;

    /* ===============================
       STRICT MODE → RAG
       =============================== */
    if (strict) {
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

      const context = chunks
        .map((c, i) => `Source ${i + 1} (${c.source}):\n${c.text}`)
        .join("\n\n");

      messages = [
        {
          role: "system",
          content: `
You are an academic explanation generator.

STRICT RULES:
- Use ONLY the provided context
- Do NOT add outside knowledge
- Do NOT introduce yourself
- Follow the explanation style carefully

EXPLANATION STYLE:
${styleInstruction}

CONTEXT:
${context}
          `,
        },
        {
          role: "user",
          content: message,
        },
      ];
    } else {
      /* ===============================
       NORMAL MODE → LLM
       =============================== */
      messages = [
        {
          role: "system",
          content: `
You are an explanation generator for university students.

EXPLANATION STYLE:
${styleInstruction}

Follow the style strictly.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ];
    }

    /* ===============================
       GENERATE
       =============================== */
    const completion = await client.chat.completions.create({
      model: process.env.HF_MODEL,
      messages,
      max_tokens: 600,
      temperature: strict ? 0.4 : 0.7,
    });

    const answer = completion.choices[0].message.content.trim();

    const doc = await Explanation.create({
      question: message,
      title: generateTitle(message),
      mode,
      answer,
    });

    res.json({
      id: doc._id,
      content: answer,
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Generation failed" });
  }
}
