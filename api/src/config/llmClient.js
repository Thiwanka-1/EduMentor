// api/config/llmClient.js
import axios from "axios";
import "../config/env.js";
import { hf, HF_CHAT_MODEL } from "./hfClient.js";

console.log("✅ LLM_PROVIDER =", process.env.LLM_PROVIDER);
console.log("✅ MODEL_SERVICE_URL =", process.env.MODEL_SERVICE_URL);

function getProvider() {
  return (process.env.LLM_PROVIDER || "HF").toUpperCase();
}

function normalizeUrl(u) {
  return (u || "").trim().replace(/\/+$/, "");
}

async function postJson(url, body) {
  return axios.post(url, body, {
    timeout: 180000,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Calls hosted model (Modal or your own server).
 * Tries both:
 *   1) base URL
 *   2) base + /chat
 *
 * This is safer because sometimes Modal works on "/"
 * and local FastAPI works on "/chat".
 */
async function callHostedModel(payload) {
  const base = normalizeUrl(process.env.MODEL_SERVICE_URL);
  if (!base) {
    throw new Error("MODEL_SERVICE_URL is missing in .env");
  }

  const urlsToTry = [base, `${base}/chat`];
  let lastError = null;

  for (const url of urlsToTry) {
    try {
      console.log("🟡 Trying hosted LLM URL:", url);
      const res = await postJson(url, payload);
      console.log("✅ Hosted LLM used URL:", url);
      return res.data;
    } catch (err) {
      lastError = err;

      console.error("❌ Hosted LLM request failed on:", url, {
        status: err?.response?.status,
        detail: err?.response?.data,
        message: err?.message,
      });
    }
  }

  throw lastError || new Error("Hosted model request failed");
}

function buildHistoryPrompt(messages, maxTurns = 10) {
  const turns = messages
    .filter((m) => m.role !== "system")
    .slice(-maxTurns)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`);

  return `${turns.join("\n")}\nAssistant:`;
}

/**
 * Normalizes different possible hosted-model response shapes.
 * Your backend expects a final plain string answer.
 */
function extractHostedAnswer(data) {
  if (!data) return "";

  if (typeof data === "string") return data.trim();

  if (typeof data.answer === "string") return data.answer.trim();
  if (typeof data.response === "string") return data.response.trim();
  if (typeof data.generated_text === "string") return data.generated_text.trim();
  if (typeof data.output === "string") return data.output.trim();

  if (Array.isArray(data) && typeof data[0] === "string") {
    return data[0].trim();
  }

  if (
    Array.isArray(data) &&
    data[0] &&
    typeof data[0].generated_text === "string"
  ) {
    return data[0].generated_text.trim();
  }

  return "";
}

/**
 * One unified function your controllers call.
 * Switches between HF and Hosted provider based on env.
 */
export async function generateBuddyCompletion({
  messages,
  max_tokens = 340,
  temperature = 0.6,
  top_p = 0.95,
}) {
  if (getProvider() === "MODAL") {
    const system = messages.find((m) => m.role === "system")?.content || "";
    const prompt = buildHistoryPrompt(messages, 10);

    const payload = {
      prompt,
      system,
      max_new_tokens: max_tokens,
      temperature,
      top_p,
    };

    console.log("🟡 Sending payload to hosted model:", {
      hasPrompt: !!payload.prompt,
      promptLength: payload.prompt?.length || 0,
      hasSystem: !!payload.system,
      systemLength: payload.system?.length || 0,
      max_new_tokens: payload.max_new_tokens,
      temperature: payload.temperature,
      top_p: payload.top_p,
    });

    const data = await callHostedModel(payload);
    const answer = extractHostedAnswer(data);

    if (!answer) {
      console.error("❌ Hosted LLM returned unexpected response:", data);
      throw new Error("Hosted model returned no usable answer");
    }

    return answer;
  }

  const completion = await hf.chatCompletion({
    model: HF_CHAT_MODEL,
    messages,
    max_tokens,
    temperature,
    top_p,
  });

  return completion?.choices?.[0]?.message?.content?.trim() || "";
}