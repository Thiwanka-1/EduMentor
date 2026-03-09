import StudentProfile from "../models/studentProfile.model.js";
import TopicProgress from "../models/topicProgress.model.js";
import { generate } from "../services/ollama.service.js";

function getDifficulty(score) {
  if (score >= 85) return "hard";
  if (score >= 60) return "medium";
  return "easy";
}

// Custom JSON parser for reinforcement quiz responses.
// Handles raw arrays, corrupted trailing text, and partial JSON
// that the shared sanitizeJSON (designed for {}-shaped quiz
// responses with "correct_answer" fields) cannot handle.
function parseReinforcementJSON(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty response from AI model");
  }

  let cleaned = raw.trim();
  console.log("   Raw response preview:", cleaned.slice(0, 300));

  // Strip markdown code fences
  cleaned = cleaned
    .replace(/^```(?:json)?[\r\n]*/i, "")
    .replace(/[\r\n]*```\s*$/i, "")
    .trim();

  const arrStart = cleaned.indexOf("[");
  const arrEnd = cleaned.lastIndexOf("]");

  if (arrStart !== -1 && arrEnd > arrStart) {
    let arrayStr = cleaned.slice(arrStart, arrEnd + 1);

    // Remove trailing commas before ] or }
    arrayStr = arrayStr.replace(/,(\s*[}\]])/g, "$1");

    try {
      const parsed = JSON.parse(arrayStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(
          `   Reinforcement JSON parsed (strategy 1): ${parsed.length} items`,
        );
        return parsed;
      }
    } catch (e) {
      console.warn("    Strategy 1 failed:", e.message);
    }
  }

  // Handles cases where garbage text appears inside the array
  if (arrStart !== -1) {
    let arrayStr = cleaned.slice(arrStart);

    // Find all complete {...} blocks and reconstruct a valid array
    const objectBlocks = [];
    const objRegex = /\{[^{}]*\}/g;
    let match;

    while ((match = objRegex.exec(arrayStr)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        if (obj.question) {
          objectBlocks.push(obj);
        }
      } catch (_) {
        // skip malformed blocks
      }
    }

    if (objectBlocks.length > 0) {
      console.log(
        `   Reinforcement JSON parsed (strategy 2): ${objectBlocks.length} items`,
      );
      return objectBlocks;
    }
  }

  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");

  if (objStart !== -1 && objEnd > objStart) {
    let objStr = cleaned.slice(objStart, objEnd + 1);
    objStr = objStr.replace(/,(\s*[}\]])/g, "$1");

    try {
      const parsed = JSON.parse(objStr);
      const questions = parsed.questions || parsed;
      if (Array.isArray(questions) && questions.length > 0) {
        console.log(
          `   Reinforcement JSON parsed (strategy 3): ${questions.length} items`,
        );
        return questions;
      }
    } catch (_) {
      // fall through
    }
  }

  console.error(" All reinforcement JSON parse strategies failed.");
  console.error("   Raw output (first 500 chars):\n", raw.slice(0, 500));
  throw new Error(
    "The AI model returned an unexpected format. Please try again.",
  );
}

// GET /api/reinforce/weak-topics
// Return weak topics for the logged-in user
export async function getWeakTopics(req, res, next) {
  try {
    const userId = req.user._id.toString();

    const profile = await StudentProfile.findOne({ userId }).lean();

    if (!profile || !profile.weakTopics || profile.weakTopics.length === 0) {
      return res.json({
        success: true,
        weakTopics: [],
        message: "No weak topics found. Great job!",
      });
    }

    // Fetch or initialise progress for each weak topic
    const progressList = [];

    for (const topic of profile.weakTopics) {
      let progress = await TopicProgress.findOne({ userId, topic }).lean();

      if (!progress) {
        // First time seeing this topic — create a blank record
        progress = await TopicProgress.create({
          userId,
          topic,
          masteryScore: 0,
          difficulty: "easy",
          attempts: 0,
          completed: false,
        });
        progress = progress.toObject();
      }

      progressList.push({
        topic: progress.topic,
        masteryScore: progress.masteryScore,
        difficulty: progress.difficulty,
        attempts: progress.attempts,
        completed: progress.completed,
      });
    }

    res.json({ success: true, weakTopics: progressList });
  } catch (err) {
    next(err);
  }
}

// POST /api/reinforce/generate-quiz
// Body: { topic }
// Generate a quiz for a specific weak topic using Ollama
export async function generateReinforcementQuiz(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: "topic is required.",
      });
    }

    // Get or create progress for this topic
    let progress = await TopicProgress.findOne({ userId, topic });

    if (!progress) {
      progress = await TopicProgress.create({
        userId,
        topic,
        masteryScore: 0,
        difficulty: "easy",
        attempts: 0,
        completed: false,
      });
    }

    if (progress.completed) {
      return res.json({
        success: true,
        completed: true,
        message: `Topic "${topic}" is already mastered!`,
        masteryScore: progress.masteryScore,
      });
    }

    const difficulty = getDifficulty(progress.masteryScore);

    // Build the reinforcement prompt — explicit and strict for phi3
    const prompt = `You are a quiz generator. Generate exactly 5 multiple-choice questions about "${topic}" at ${difficulty} difficulty.

Rules:
- Return ONLY a valid JSON array, nothing else.
- Each object must have exactly 3 keys: "question", "options", "answer".
- "options" must be an array of exactly 4 strings.
- "answer" must be one letter: "A", "B", "C", or "D".
- Do NOT add any text before or after the JSON.

Example format:
[{"question":"What is X?","options":["Option A","Option B","Option C","Option D"],"answer":"B"}]`;

    console.log(`\n Reinforcement quiz for "${topic}" (${difficulty})`);

    const rawResponse = await generate(prompt);
    const questions = parseReinforcementJSON(rawResponse);

    // Normalise questions to a consistent shape
    const normalisedQuestions = questions
      .filter((q) => q && q.question)
      .map((q, i) => ({
        id: i + 1,
        question: q.question,
        options: q.options || [],
        answer: q.answer || q.correct_answer || "",
      }));

    if (normalisedQuestions.length === 0) {
      throw new Error(
        "The AI model did not return any valid questions. Please try again.",
      );
    }

    console.log(
      `   Generated ${normalisedQuestions.length} reinforcement questions`,
    );

    res.json({
      success: true,
      topic,
      difficulty,
      masteryScore: progress.masteryScore,
      attempts: progress.attempts,
      questions: normalisedQuestions,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/reinforce/submit
// Body: { topic, answers: [{ questionId, userAnswer, correctAnswer }] }
// Score the answers and update mastery / difficulty
export async function submitReinforcementAnswers(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const { topic, answers } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: "topic is required.",
      });
    }
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "answers array is required and must not be empty.",
      });
    }

    // Score the answers
    let correctCount = 0;
    const results = [];

    for (const ans of answers) {
      const userAns = (ans.userAnswer || "").toString().trim().toLowerCase();
      const correctAns = (ans.correctAnswer || "")
        .toString()
        .trim()
        .toLowerCase();

      // Match full text or leading letter (A / B / C / D)
      const isCorrect =
        userAns === correctAns ||
        (userAns.length === 1 &&
          correctAns.length === 1 &&
          userAns === correctAns) ||
        (userAns.charAt(0).toLowerCase() ===
          correctAns.charAt(0).toLowerCase() &&
          correctAns.length === 1);

      if (isCorrect) correctCount++;

      results.push({
        questionId: ans.questionId,
        userAnswer: ans.userAnswer,
        correctAnswer: ans.correctAnswer,
        isCorrect,
      });
    }

    const totalQuestions = answers.length;
    const roundScore = Math.round((correctCount / totalQuestions) * 100);

    // Get or create progress record
    let progress = await TopicProgress.findOne({ userId, topic });

    if (!progress) {
      progress = await TopicProgress.create({
        userId,
        topic,
        masteryScore: 0,
        difficulty: "easy",
        attempts: 0,
        completed: false,
      });
    }

    // Update mastery: weighted average — 40 % existing + 60 % new round
    const newMastery = Math.round(
      progress.masteryScore * 0.4 + roundScore * 0.6,
    );
    const newDifficulty = getDifficulty(newMastery);
    const isCompleted = newMastery > 95;

    progress.masteryScore = newMastery;
    progress.difficulty = newDifficulty;
    progress.attempts += 1;
    progress.completed = isCompleted;
    await progress.save();

    if (isCompleted) {
      await StudentProfile.updateOne(
        { userId },
        {
          $pull: { weakTopics: topic },
          $addToSet: { strongTopics: topic },
        },
      );
      console.log(`   Topic "${topic}" mastered by user ${userId}`);
    }

    console.log(
      `   Reinforcement result: ${correctCount}/${totalQuestions} (${roundScore}%) → mastery ${newMastery}%`,
    );

    res.json({
      success: true,
      topic,
      roundScore,
      correctCount,
      totalQuestions,
      masteryScore: newMastery,
      difficulty: newDifficulty,
      attempts: progress.attempts,
      completed: isCompleted,
      results,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reinforce/progress
// Return progress for all topics the user has worked on
export async function getProgress(req, res, next) {
  try {
    const userId = req.user._id.toString();

    const progressList = await TopicProgress.find({ userId })
      .sort({ completed: 1, masteryScore: 1 })
      .lean();

    res.json({
      success: true,
      progress: progressList.map((p) => ({
        topic: p.topic,
        masteryScore: p.masteryScore,
        difficulty: p.difficulty,
        attempts: p.attempts,
        completed: p.completed,
      })),
    });
  } catch (err) {
    next(err);
  }
}