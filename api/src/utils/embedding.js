import { pipeline } from "@xenova/transformers";

let embedder = null;

export async function generateEmbedding(text) {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const embedding = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(embedding.data);
}
