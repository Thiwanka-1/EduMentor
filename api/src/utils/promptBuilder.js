export function buildQuizPrompt({ studyText, questionType, difficulty, quantity }) {
  // AGGRESSIVE SPEED OPTIMIZATION:
  // Short context = much faster local reading and generation times
  const MAX_CHARS = 1000;
  const material =
    studyText.length > MAX_CHARS
      ? studyText.slice(0, MAX_CHARS) + "..."
      : studyText;

  const example = buildExample(questionType);

  return `Generate a JSON quiz from the text below.
Quantity: ${quantity} questions
Type: ${formatType(questionType)}
Difficulty: ${difficulty}

RULES: Output ONLY valid JSON containing a "questions" array. No chat, no markdown.
Every question MUST include: id, question, type, correct_answer, explanation.
${getTypeRule(questionType)}

FORMAT EXAMPLE:
${example}

TEXT:
"""
${material}
"""`;
}

/**
 * Build a concrete JSON example for the model to copy the structure from.
 */
function buildExample(type) {
  switch (type) {
    case "true_false":
      return JSON.stringify(
        {
          questions: [
            {
              id: 1,
              question: "Statement from the material that is true or false.",
              type: "true_false",
              options: ["True", "False"],
              correct_answer: "True",
              explanation:
                "Explanation why this is true based on the material.",
            },
          ],
        },
        null,
        2,
      );

    case "short_answer":
      return JSON.stringify(
        {
          questions: [
            {
              id: 1,
              question: "What is [concept from material]?",
              type: "short_answer",
              options: null,
              correct_answer: "The concise correct answer.",
              explanation: "Explanation based on the material.",
            },
          ],
        },
        null,
        2,
      );

    case "mixed":
      return JSON.stringify(
        {
          questions: [
            {
              id: 1,
              question: "What is [concept]?",
              type: "multiple_choice",
              options: [
                "A) Option one",
                "B) Option two",
                "C) Option three",
                "D) Option four",
              ],
              correct_answer: "A",
              explanation: "Explanation.",
            },
            {
              id: 2,
              question: "[Statement about the material].",
              type: "true_false",
              options: ["True", "False"],
              correct_answer: "True",
              explanation: "Explanation.",
            },
          ],
        },
        null,
        2,
      );

    case "multiple_choice":
    default:
      return JSON.stringify(
        {
          questions: [
            {
              id: 1,
              question: "What is [concept from the material]?",
              type: "multiple_choice",
              options: [
                "A) Option one",
                "B) Option two",
                "C) Option three",
                "D) Option four",
              ],
              correct_answer: "A",
              explanation:
                "Explanation of why A is correct based on the material.",
            },
          ],
        },
        null,
        2,
      );
  }
}

function getTypeRule(type) {
  switch (type) {
    case "multiple_choice":
      return '- options must be exactly 4 items: ["A) ...", "B) ...", "C) ...", "D) ..."]\n- correct_answer must be just the letter: "A", "B", "C", or "D"';
    case "true_false":
      return '- options must be ["True", "False"]\n- correct_answer must be "True" or "False"';
    case "short_answer":
      return "- options must be null\n- correct_answer is a short phrase or sentence";
    case "mixed":
      return "- mix multiple_choice, true_false, and short_answer types\n- follow the rules for each type";
    default:
      return "";
  }
}

function formatType(type) {
  const map = {
    multiple_choice: "Multiple Choice",
    true_false: "True / False",
    short_answer: "Short Answer",
    mixed: "Mixed",
  };
  return map[type] || type;
}