// controllers/docController.js
import "../config/env.js";
import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse-debugging-disabled";

import { hf, HF_EMBED_MODEL } from "../config/hfClient.js";
import { DocChunk } from "../models/DocChunk.js";
import { DocFile } from "../models/DocFile.js";

// ---------- chunking ----------
function chunkText(text, chunkSize = 900, overlap = 200) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

function normalizeEmbedding(output) {
  if (!output) return [];
  if (Array.isArray(output[0])) return output[0].map(Number);
  return output.map(Number);
}

// small concurrency limiter (to avoid HF rate limits)
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

async function embedTexts(texts = []) {
  if (!texts.length) return [];
  const vectors = await mapLimit(texts, 3, async (t) => {
    const res = await hf.featureExtraction({ model: HF_EMBED_MODEL, inputs: t });
    return normalizeEmbedding(res);
  });
  return vectors;
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export function buildContextText(blocks) {
  if (!blocks?.length) return "";
  return blocks
    .map(
      (b) =>
        `[TITLE:${b.title} | CHUNK:${b.page}]\n` +
        b.text.replace(/\s+/g, " ").slice(0, 900)
    )
    .join("\n\n");
}

// ---------- upload TEXT ----------
export async function uploadTextDoc(req, res) {
  try {
    const { userId, sessionId, title, text } = req.body;
    if (!userId || !sessionId || !title || !text) {
      return res.status(400).json({ error: "userId, sessionId, title, text are required" });
    }

    const chunks = chunkText(text);
    if (!chunks.length) return res.status(400).json({ error: "Text is empty after cleaning." });

    const embeddings = await embedTexts(chunks);
    const docId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const docsToInsert = chunks.map((chunk, idx) => ({
      userId,
      sessionId,
      docId,
      title,
      page: idx + 1,
      text: chunk,
      embedding: embeddings[idx],
    }));

    await DocChunk.insertMany(docsToInsert);

    return res.json({ message: "Text notes uploaded and indexed.", docId, chunks: docsToInsert.length });
  } catch (err) {
    console.error("uploadTextDoc error:", err);
    return res.status(500).json({ error: "Server error while uploading text." });
  }
}

// ---------- upload PDF ----------
function toRelativeStoragePath(absPath) {
  const rel = path.relative(process.cwd(), absPath);
  return rel.split(path.sep).join("/"); // windows -> linux friendly
}

// optional: normalize vector to unit length (helps cosine similarity)
function l2Normalize(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) sum += vec[i] * vec[i];
  const norm = Math.sqrt(sum) || 1;
  return vec.map((x) => x / norm);
}

export async function uploadPdfDoc(req, res) {
  try {
    const { userId, sessionId, title } = req.body;

    if (!userId || !sessionId || !title) {
      return res
        .status(400)
        .json({ error: "userId, sessionId, title are required" });
    }

    if (!req.file?.path) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    // basic mime check (multer usually provides this)
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are allowed." });
    }

    const filePath = req.file.path; // absolute or relative depending on multer
    const buffer = await fs.readFile(filePath);

    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (e) {
      return res.status(400).json({ error: "Failed to parse the PDF file." });
    }

    const text = (pdfData.text || "").replace(/\s+/g, " ").trim();
    if (!text) {
      return res
        .status(400)
        .json({ error: "Could not extract text from PDF." });
    }

    const chunks = chunkText(text);
    if (!chunks.length) {
      return res.status(400).json({ error: "No text chunks produced." });
    }

    const docId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // Embed chunks (make sure embedTexts returns same length)
    const embeddings = await embedTexts(chunks);

    if (!embeddings?.length || embeddings.length !== chunks.length) {
      return res.status(500).json({
        error:
          "Embedding failed for some chunks. Try again or reduce PDF size/pages.",
      });
    }

    // Save doc metadata (DocFile)
    await DocFile.create({
      userId,
      sessionId,
      docId,
      title,
      originalName: req.file.originalname || "",
      mimeType: req.file.mimetype || "application/pdf",
      sizeBytes: req.file.size || 0,
      storagePath: toRelativeStoragePath(filePath), // ✅ portable path
      storageType: "local",
      createdAt: new Date(),
    });

    // Save chunks
    const docsToInsert = chunks.map((chunk, idx) => ({
      userId,
      sessionId,
      docId,
      title,
      page: idx + 1, // chunk number (not real pdf page)
      text: chunk,
      embedding: l2Normalize(embeddings[idx]), // optional but good
      createdAt: new Date(),
    }));

    await DocChunk.insertMany(docsToInsert);

    return res.json({
      message: "PDF uploaded and indexed for RAG.",
      docId,
      chunks: docsToInsert.length,
    });
  } catch (err) {
    console.error("uploadPdfDoc error:", err);
    return res.status(500).json({ error: "Server error while uploading PDF." });
  }
}
// ---------- retrieve (SESSION-BASED!) ----------
export async function retrieveStudyContext(userId, sessionId, query, topK = 5) {
  const chunks = await DocChunk.find({ userId, sessionId })
    .sort({ createdAt: -1 })
    .limit(400)
    .lean();

  if (!chunks.length) return [];

  const qRes = await hf.featureExtraction({ model: HF_EMBED_MODEL, inputs: query });
  const qVec = normalizeEmbedding(qRes);

  const scored = chunks.map((c) => ({ ...c, score: cosineSim(qVec, c.embedding) }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
