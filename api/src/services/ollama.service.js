// Ollama Service
// Handles communication with the local Ollama API

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

/**
 * Send a prompt to the Ollama /api/generate endpoint.
 * Includes automatic retry logic for timeouts and model loading delays.
 *
 * @param {string} prompt – the full prompt text
 * @param {Object} [options]
 * @param {string} [options.model]      – override the default model
 * @param {number} [options.timeout]    – request timeout in ms (default 10 min)
 * @param {number} [options.maxRetries] – number of retries on timeout (default 2)
 * @returns {Promise<string>} the raw text response from the model
 */
async function generate(prompt, options = {}) {
  const model = options.model || OLLAMA_MODEL;
  const timeoutMs = options.timeout || 10 * 60 * 1000; // 10 minutes (was 5)
  const maxRetries = options.maxRetries ?? 2;

  const url = `${OLLAMA_BASE}/api/generate`;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`   Retry attempt ${attempt}/${maxRetries}…`);
      // Wait a bit before retrying to let the model finish loading
      await sleep(3000);
    }

    console.log(
      `   Sending prompt to Ollama (${model})… [attempt ${attempt + 1}]`,
      );
    console.log(`   Prompt length: ${prompt.length.toLocaleString()} chars`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.4,
            top_p: 0.9,
            num_ctx: 1024, // Ultra-low memory footprint for maximum speed
            num_predict: 1536, // Enough tokens to answer up to 10-15 short questions
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(
          `Ollama returned ${res.status}: ${errorText || "Unknown error"}`,
          );
      }

      const data = await res.json();

      if (!data.response) {
        throw new Error("Ollama returned an empty response");
      }

      console.log(
        `   Response received (${data.response.length.toLocaleString()} chars)`,
        );
      return data.response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      if (err.name === "AbortError") {
        console.warn(
          `  ⏱  Attempt ${attempt + 1} timed out after ${timeoutMs / 1000}s`,
          );

        // If we still have retries left, continue the loop
        if (attempt < maxRetries) {
          continue;
        }

        throw new Error(
          "Ollama request timed out after multiple attempts. " +
            "Tips: (1) Make sure Ollama is running with `ollama serve`, " +
            "(2) Try pre-loading the model with `ollama run " +
            model +
            "`, " +
            "(3) Reduce the number of questions, " +
            "(4) Try a smaller model like `mistral` or `tinyllama`.",
            );
      }

      if (
        err.cause?.code === "ECONNREFUSED" ||
        err.message?.includes("ECONNREFUSED")
) {
        throw new Error(
          "Cannot connect to Ollama. Make sure Ollama is running:\n" +
            "  1. Open a terminal and run: ollama serve\n" +
            "  2. Then run: ollama pull " +
            model,
            );
      }

      // For other errors, don't retry – throw immediately
      throw err;
    }
  }

  throw lastError || new Error("Ollama generation failed");
}

/**
 * Pre-warm the Ollama model by sending a tiny prompt.
 * This loads the model into memory so subsequent requests are fast.
 */
async function warmUp() {
  const model = OLLAMA_MODEL;
  console.log(`   Warming up Ollama model "${model}"…`);

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: "Hi",
        stream: false,
        options: { num_predict: 1 }, // generate just 1 token
      }),
    });

    if (res.ok) {
      await res.json(); // consume the body
      console.log(`   Model "${model}" is warm and ready!`);
    } else {
      const text = await res.text().catch(() => "");
      console.warn(
        `    Warm-up got status ${res.status}: ${text.slice(0, 100)}`,
        );
    }
  } catch (err) {
    console.warn(`    Could not warm up Ollama: ${err.message}`);
    console.warn(`     Make sure Ollama is running: ollama serve`);
  }
}

/**
 * Check if Ollama is reachable and the model is available.
 */
async function checkHealth() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) return { ok: false, error: `Ollama returned ${res.status}` };

    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    const hasModel = models.some((n) => n.startsWith(OLLAMA_MODEL));

    return {
      ok: true,
      models,
      activeModel: OLLAMA_MODEL,
      modelAvailable: hasModel,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { generate, checkHealth, warmUp };
