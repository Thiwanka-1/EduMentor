import { HfInference } from "@huggingface/inference";
import Chroma from "chromadb";
import pdf from "pdf-parse";
import fs from "fs";

const hf = new HfInference(process.env.HF_API_KEY);
const chroma = new Chroma.Client();
let collection;

async function initVectorDB() {
  collection = await chroma.getOrCreateCollection({ name: "edumentor" });
}
initVectorDB();

export async function addPDFToRAG(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdf(buffer);
  const text = data.text;

  const chunks = text.match(/.{1,500}/g);

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: chunks[i]
    });

    await collection.add({
      ids: [`chunk-${i}`],
      embeddings: embedding,
      documents: [chunks[i]]
    });
  }

  return { status: "indexed", chunks: chunks.length };
}

export async function ragQuery(question) {
  const qEmbed = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: question
  });

  const results = await collection.query({
    nResults: 4,
    queryEmbeddings: qEmbed
  });

  const context = results.documents.flat().join("\n");

  const answer = await hf.chatCompletion({
    model: process.env.MODEL_ID,
    messages: [
      {
        role: "system",
        content: `Use ONLY the following context to answer. Do not hallucinate.
        Context:\n${context}`
      },
      { role: "user", content: question }
    ],
  });

  return answer.choices[0].message.content;
}
