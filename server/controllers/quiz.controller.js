// ──────────────────────────────────────────────────────────────
// Quiz Controller  — MongoDB Atlas Version
// Handles quiz generation and regeneration via Ollama
// ──────────────────────────────────────────────────────────────
const Material = require("../models/material.model");
const Quiz = require("../models/quiz.model");
const { generate, checkHealth } = require("../services/ollama.service");
const { buildQuizPrompt } = require("../utils/promptBuilder");
const { sanitizeJSON } = require("../utils/jsonSanitizer");

/**
 * POST /api/quiz/generate
 * Body: { materialId, questionType, difficulty, quantity }
 */
async function generateQuiz(req, res, next) {
  try {
    const { materialId, questionType, difficulty, quantity } = req.body;

    // ── Validation ────────────────────────────────────────
    if (!materialId) {
      return res.status(400).json({
        success: false,
        error: "materialId is required. Upload materials first.",
      });
    }

    // Fetch material from MongoDB
    const material = await Material.findById(materialId).lean();
    if (!material) {
      return res.status(404).json({
        success: false,
        error:
          "Material not found. It may have been deleted. Please re-upload.",
      });
    }

    const qType = questionType || "multiple_choice";
    const diff = difficulty || "medium";
    const qty = Math.max(parseInt(quantity) || 10, 1);

    console.log(`\n🧠 Generating quiz:`);
    console.log(`   Type: ${qType} | Difficulty: ${diff} | Quantity: ${qty}`);

    // ── Build prompt ──────────────────────────────────────
    const prompt = buildQuizPrompt({
      studyText: material.textContent,
      questionType: qType,
      difficulty: diff,
      quantity: qty,
    });

    // ── Call Ollama ────────────────────────────────────────
    const rawResponse = await generate(prompt);

    // ── Parse JSON ────────────────────────────────────────
    const parsed = sanitizeJSON(rawResponse);
    const questions = parsed.questions || parsed;

    // Number the questions if not numbered
    const numberedQuestions = (Array.isArray(questions) ? questions : []).map(
      (q, i) => ({
        id: q.id || i + 1,
        question: q.question,
        type: q.type || qType,
        options: q.options || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation || "",
      }),
    );

    // ── Save quiz to MongoDB ─────────────────────────────
    const quiz = new Quiz({
      materialId: material._id,
      config: { questionType: qType, difficulty: diff, quantity: qty },
      questions: numberedQuestions,
    });

    await quiz.save();

    console.log(
      `  ✅ Quiz saved to MongoDB: ${quiz._id} (${numberedQuestions.length} questions)`,
    );

    res.json({
      success: true,
      quizId: quiz._id,
      materialId: material._id,
      config: quiz.config,
      questions: numberedQuestions,
      generatedAt: quiz.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quiz/regenerate
 * Body: { materialId, questionType?, difficulty?, quantity? }
 * Regenerate a fresh set of questions from the same material.
 */
async function regenerateQuiz(req, res, next) {
  try {
    const { materialId, questionType, difficulty, quantity } = req.body;

    if (!materialId) {
      return res.status(400).json({
        success: false,
        error: "materialId is required.",
      });
    }

    // Use previous config if not provided
    const lastQuiz = await Quiz.findOne({ materialId })
      .sort({ createdAt: -1 })
      .lean();

    const config = {
      questionType:
        questionType || lastQuiz?.config?.questionType || "multiple_choice",
      difficulty: difficulty || lastQuiz?.config?.difficulty || "medium",
      quantity: quantity || lastQuiz?.config?.quantity || 10,
    };

    // Delegate to generateQuiz with the merged config
    req.body = { materialId, ...config };
    return generateQuiz(req, res, next);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quiz/:id
 * Get a specific quiz by its ID.
 */
async function getQuizById(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("materialId", "title files fileType")
      .lean();

    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    res.json({
      success: true,
      quiz: {
        id: quiz._id,
        materialId: quiz.materialId,
        config: quiz.config,
        questions: quiz.questions,
        createdAt: quiz.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quiz/material/:materialId
 * Get all quizzes for a specific material.
 */
async function getQuizzesByMaterial(req, res, next) {
  try {
    const quizzes = await Quiz.find({ materialId: req.params.materialId })
      .select("-questions") // Exclude questions for listing
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      quizzes: quizzes.map((q) => ({
        id: q._id,
        materialId: q.materialId,
        config: q.config,
        questionCount: q.questions?.length || 0,
        createdAt: q.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quizzes
 * Get all quizzes (listing, no questions).
 */
async function listAllQuizzes(_req, res, next) {
  try {
    const quizzes = await Quiz.find()
      .populate("materialId", "title files fileType")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      quizzes: quizzes.map((q) => ({
        id: q._id,
        material: q.materialId,
        config: q.config,
        questionCount: q.questions?.length || 0,
        createdAt: q.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quiz/health
 * Check Ollama service health.
 */
async function ollamaHealth(_req, res) {
  const health = await checkHealth();
  res.json({ success: true, ollama: health });
}

module.exports = {
  generateQuiz,
  regenerateQuiz,
  getQuizById,
  getQuizzesByMaterial,
  listAllQuizzes,
  ollamaHealth,
};
