// ──────────────────────────────────────────────────────────────
// JSON Sanitizer
// Extracts valid JSON from raw Ollama output.
// llama3 often adds preamble text, wraps in markdown, or has
// minor formatting issues. This handles all known cases.
// ──────────────────────────────────────────────────────────────

/**
 * Extract and parse a JSON object from raw LLM output.
 * @param {string} raw – raw text from Ollama
 * @returns {Object} parsed quiz JSON
 */
function sanitizeJSON(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty response from AI model");
  }

  let cleaned = raw.trim();

  // Log first 200 chars so we can see what the model returned
  console.log("  📄 Raw response preview:", cleaned.slice(0, 200));

  // ── Strategy 1: strip markdown fences ──────────────────
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned
    .replace(/^```(?:json)?[\r\n]*/i, "")
    .replace(/[\r\n]*```\s*$/i, "")
    .trim();

  // ── Strategy 2: find the outermost { ... } block ───────
  // This handles cases where the model adds text before/after JSON
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  // ── Strategy 3: fix common LLM JSON mistakes ───────────

  // Remove trailing commas before ] or }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Fix unescaped quotes inside string values (heuristic)
  // e.g.  "question": "What is "ATP"?" → replace inner quotes
  // We do this carefully: only between key: "..." boundaries
  // (skipped — too risky to mangle valid JSON)

  // ── Parse attempt 1 ─────────────────────────────────────
  try {
    const parsed = JSON.parse(cleaned);
    validateQuizShape(parsed);
    console.log("  ✅ JSON parsed successfully (pass 1)");
    return parsed;
  } catch (e1) {
    console.warn("  ⚠️  Parse pass 1 failed:", e1.message);
  }

  // ── Parse attempt 2: aggressively trim trailing garbage ──
  try {
    // Find last complete closing brace of the questions array
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace > 0) {
      const trimmed = cleaned.slice(0, lastBrace + 1);
      const parsed = JSON.parse(trimmed);
      validateQuizShape(parsed);
      console.log("  ✅ JSON parsed successfully (pass 2)");
      return parsed;
    }
  } catch (e2) {
    console.warn("  ⚠️  Parse pass 2 failed:", e2.message);
  }

  // ── Parse attempt 3: extract questions array directly ────
  try {
    const arrayMatch = cleaned.match(/"questions"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
    if (arrayMatch) {
      const questions = JSON.parse(arrayMatch[1]);
      console.log("  ✅ JSON parsed via array extraction (pass 3)");
      return { questions };
    }
  } catch (e3) {
    console.warn("  ⚠️  Parse pass 3 failed:", e3.message);
  }

  // ── All attempts failed ──────────────────────────────────
  console.error("❌ All JSON parse attempts failed.");
  console.error("   Raw output (first 800 chars):\n", raw.slice(0, 800));

  throw new Error(
    "The AI model returned an unexpected format. Please click Regenerate to try again.",
  );
}

/**
 * Verify the parsed object has the expected shape.
 * Throws if the questions array is missing or empty.
 */
function validateQuizShape(parsed) {
  const questions = parsed.questions || parsed;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No questions array found in parsed JSON");
  }
  // Ensure each question has at least question + correct_answer
  for (const q of questions) {
    if (!q.question || !q.correct_answer) {
      throw new Error("Question missing required fields");
    }
  }
}

module.exports = { sanitizeJSON };
