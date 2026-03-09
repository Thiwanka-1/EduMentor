// backend/services/aiModelService.js (ESM / Node 22)
import "dotenv/config";
import fetch from "node-fetch";

function teacherSystemPrompt() {
  return `
You are EduMentor — an AI Teacher.

Always format output like:
📘 Explanation:
🧩 Steps:
📝 Examples:
🎯 Summary:

Rules:
- Simple English
- Step-by-step
- Give 2-3 examples
- End with a short summary
`.trim();
}

function createTimeoutSignal(ms, parentSignal) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(new Error("LLM timeout")), ms);

  const onAbort = () =>
    controller.abort(parentSignal?.reason || new Error("aborted"));
  parentSignal?.addEventListener?.("abort", onAbort, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(t);
      parentSignal?.removeEventListener?.("abort", onAbort);
    },
  };
}

// --- vLLM (OpenAI style) ---
async function callVLLM_OpenAI({ baseUrl, model, question, maxTokens, temp, signal }) {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: teacherSystemPrompt() },
        { role: "user", content: question },
      ],
      temperature: temp,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`vLLM(OpenAI) HTTP ${res.status}`);
  const json = await res.json();
  return json?.choices?.[0]?.message?.content?.trim() || null;
}

// --- vLLM (/generate style) ---
async function callVLLM_Generate({ baseUrl, model, question, maxTokens, temp, signal }) {
  const res = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      prompt: `${teacherSystemPrompt()}\n\nUSER:\n${question}\n\nASSISTANT:\n`,
      max_tokens: maxTokens,
      temperature: temp,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`vLLM(/generate) HTTP ${res.status}`);
  const json = await res.json();
  return (
    json?.text ||
    json?.response ||
    json?.choices?.[0]?.text ||
    json?.choices?.[0]?.message?.content ||
    null
  );
}

// --- Ollama ---
async function callOllama({ baseUrl, model, question, signal }) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: teacherSystemPrompt() },
        { role: "user", content: question },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const json = await res.json();
  return json?.message?.content?.trim() || null;
}

// --- HuggingFace Router ---
async function callHF({ apiKey, model, question, maxTokens, temp, signal }) {
  const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: teacherSystemPrompt() },
        { role: "user", content: question },
      ],
      temperature: temp,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`HF HTTP ${res.status}`);
  const json = await res.json();
  return json?.choices?.[0]?.message?.content?.trim() || null;
}

// ✅ keep same export name so TutorMode never breaks
export async function getTutorResponse(question, opts = {}) {
  const q = (question || "").trim();
  if (!q) return "Please ask a question 🙂";

  // ✅ READ ENV HERE (NO CACHE)
  const VLLM_URL = process.env.VLLM_URL; // base url only
  const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";
  const HF_API_KEY = process.env.HF_API_KEY;
  const MODEL_ID = process.env.MODEL_ID || "meta-llama/Llama-3.1-8B-Instruct";

  const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 45000);
  const MAX_TOKENS = Number(process.env.MAX_TOKENS || 400);
  const TEMPERATURE = Number(process.env.TEMPERATURE || 0.6);

  const { signal, cleanup } = createTimeoutSignal(LLM_TIMEOUT_MS, opts.signal);

  try {
    // 1) vLLM OpenAI
    if (VLLM_URL) {
      try {
        const out = await callVLLM_OpenAI({
          baseUrl: VLLM_URL,
          model: MODEL_ID,
          question: q,
          maxTokens: MAX_TOKENS,
          temp: TEMPERATURE,
          signal,
        });
        if (out) return out;
      } catch (e) {
        console.warn("vLLM(OpenAI) failed → fallback:", e?.message || e);
      }

      // 2) vLLM /generate
      try {
        const out = await callVLLM_Generate({
          baseUrl: VLLM_URL,
          model: MODEL_ID,
          question: q,
          maxTokens: MAX_TOKENS,
          temp: TEMPERATURE,
          signal,
        });
        if (out) return out;
      } catch (e) {
        console.warn("vLLM(/generate) failed → fallback:", e?.message || e);
      }
    } else {
      console.warn("vLLM(OpenAI) failed → fallback: VLLM_URL not set");
      console.warn("vLLM(/generate) failed → fallback: VLLM_URL not set");
    }

    // 3) Ollama
    try {
      const out = await callOllama({
        baseUrl: OLLAMA_URL,
        model: OLLAMA_MODEL,
        question: q,
        signal,
      });
      if (out) return out;
    } catch (e) {
      console.warn("Ollama failed → fallback:", e?.message || e);
    }

    // 4) HF
    if (HF_API_KEY) {
      try {
        const out = await callHF({
          apiKey: HF_API_KEY,
          model: MODEL_ID,
          question: q,
          maxTokens: MAX_TOKENS,
          temp: TEMPERATURE,
          signal,
        });
        if (out) return out;
      } catch (e) {
        console.warn("HF failed:", e?.message || e);
      }
    } else {
      console.warn("HF failed: HF_API_KEY not set");
    }

    return "⚠️ AI Model Error. Try again in a moment.";
  } finally {
    cleanup();
  }
}
