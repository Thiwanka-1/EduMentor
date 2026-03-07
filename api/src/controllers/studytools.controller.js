import dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "openai";
import Explanation from "../models/Explanation.js";

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export async function getRelatedConcepts(req, res) {
  try {
    const { id } = req.params;

    const doc = await Explanation.findById(id).select(
      "_id question title mode answer views",
    );
    if (!doc) return res.status(404).json({ error: "Not found" });

    const question = doc.question || "";
    const answer =
      doc.views?.[doc.mode] || doc.answer || doc.views?.simple || "";

    // Keep prompt short and strict
    const completion = await client.chat.completions.create({
      model: process.env.HF_MODEL,
      messages: [
        {
          role: "system",
          content: `
You generate related academic concepts for CS/SE/IT students.

Return ONLY valid JSON like:
{"related":["topic 1","topic 2","topic 3","topic 4","topic 5"]}

Rules:
- topics must be CS/SE/IT academic concepts
- short titles (2–6 words each)
- no numbering, no explanations, no extra keys
- avoid duplicates
          `.trim(),
        },
        {
          role: "user",
          content: `QUESTION:\n${question}\n\nANSWER (for context):\n${answer}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 120,
    });

    const raw = (completion?.choices?.[0]?.message?.content || "").trim();
    const parsed = safeJsonParse(raw);

    const related = Array.isArray(parsed?.related)
      ? parsed.related
          .map((x) => String(x).trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    // fallback (if model didn't return good JSON)
    const finalRelated =
      related.length > 0
        ? related
        : [
            "Concept review",
            "Common pitfalls",
            "Real-world usage",
            "Exam questions",
            "Practice tasks",
          ];

    return res.json({ related: finalRelated });
  } catch (err) {
    console.error("Related concepts error:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate related concepts" });
  }
}
