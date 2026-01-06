//hfclient.js
import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.HF_TOKEN) {
  console.warn("⚠️ HF_TOKEN is missing in .env – Hugging Face calls will fail.");
}

export const hf = new InferenceClient(process.env.HF_TOKEN);

export const HF_CHAT_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
export const HF_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
