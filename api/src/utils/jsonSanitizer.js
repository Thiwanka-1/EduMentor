export function sanitizeJSON(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty response from AI model");
  }

  let cleaned = raw.trim();

  // Log first 200 chars so we can see what the model returned
  console.log("   Raw response preview:", cleaned.slice(0, 200));

  cleaned = cleaned
    .replace(/^```(?:json)?[\r\n]*/i, "")
    .replace(/[\r\n]*```\s*$/i, "")
    .trim();

  // Then fix trailing commas and try parsing as-is
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    let candidate = cleaned.slice(start, end + 1);
    candidate = candidate.replace(/,(\s*[}\]])/g, "$1");

    try {
      const parsed = JSON.parse(candidate);
      validateQuizShape(parsed);
      console.log("   JSON parsed successfully (pass 1)");
      return parsed;
    } catch (e1) {
      console.warn("    Parse pass 1 failed:", e1.message);
    }
  }

  // Handles truncated arrays: find the last "}" that closes a
  // question object, then close the array + wrapper properly.
  try {
    const objStart = cleaned.indexOf("{");
    if (objStart !== -1) {
      // Walk backwards from the end to find the last well-formed }
      let candidate = cleaned.slice(objStart);
      candidate = candidate.replace(/,(\s*[}\]])/g, "$1");

      // Try closing the JSON at each } from the end
      const positions = [];
      for (let i = candidate.length - 1; i >= 0; i--) {
        if (candidate[i] === "}") positions.push(i);
      }

      for (const pos of positions) {
        const slice = candidate.slice(0, pos + 1);
        // Close any unclosed array + wrapper object
        const attempts = [
          slice, // already closed
          slice + "]}", // closed array and wrapper
          slice + "\n  ]\n}", // pretty-closed
        ];

        for (const attempt of attempts) {
          const fixed = attempt.replace(/,(\s*[}\]])/g, "$1");
          try {
            const parsed = JSON.parse(fixed);
            validateQuizShape(parsed);
            console.log(
              "   JSON parsed successfully (pass 2 — truncation recovery)",
            );
            return parsed;
          } catch (_) {
            // try next position
          }
        }
      }
    }
  } catch (e2) {
    console.warn("    Parse pass 2 failed:", e2.message);
  }

  try {
    const arrayMatch = cleaned.match(/"questions"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
    if (arrayMatch) {
      const questions = JSON.parse(arrayMatch[1]);
      console.log("   JSON parsed via array extraction (pass 3)");
      return { questions };
    }
  } catch (e3) {
    console.warn("    Parse pass 3 failed:", e3.message);
  }

  // Last resort: extract every complete {question, correct_answer}
  // object from the raw text using regex, even if the array was cut.
  try {
    const objectBlocks = [];
    // Match complete {...} blocks that span multiple lines
    const objRegex = /\{(?:[^{}]|\{[^{}]*\})*\}/g;
    let match;

    while ((match = objRegex.exec(cleaned)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        if (obj.question && obj.correct_answer) {
          objectBlocks.push(obj);
        }
      } catch (_) {
        // skip malformed blocks
      }
    }

    if (objectBlocks.length > 0) {
      console.log(
        `   JSON rescued via object extraction (pass 4): ${objectBlocks.length} question(s)`,
      );
      return { questions: objectBlocks };
    }
  } catch (e4) {
    console.warn("    Parse pass 4 failed:", e4.message);
  }

  console.error(" All JSON parse attempts failed.");
  console.error("   Raw output (first 800 chars):\n", raw.slice(0, 800));

  throw new Error(
    "The AI model returned an unexpected format. Please click Regenerate to try again.",
  );
}

/**
 * Verify the parsed object has the expected shape.
 * Throws if the questions array is missing or empty.
 */
export function validateQuizShape(parsed) {
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