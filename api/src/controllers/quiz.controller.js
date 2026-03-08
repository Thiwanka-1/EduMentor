import Material from "../models/material.model.js";
import Quiz from "../models/quiz.model.js";
import { generate, checkHealth } from "../services/ollama.service.js";
import { buildQuizPrompt } from "../utils/promptBuilder.js";
import { sanitizeJSON } from "../utils/jsonSanitizer.js";

/**
 * POST /api/quiz/generate
 * Body: { materialId, questionType, difficulty, quantity }
 */
export async function generateQuiz(req, res, next) {
  try {
    const { materialId, materialIds, questionType, difficulty, quantity } =
      req.body;

    let ids = [];
    if (materialIds && Array.isArray(materialIds) && materialIds.length > 0) {
      ids = materialIds;
    } else if (materialId) {
      ids = [materialId];
    }

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "materialId or materialIds is required. Upload materials first.",
      });
    }

    const materials = await Material.find({ _id: { $in: ids } }).lean();

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        error:
          "No materials found. They may have been deleted. Please re-upload.",
      });
    }

    console.log(`\n Generating quiz from ${materials.length} material(s):`);
    materials.forEach((m) =>
      console.log(
        `   • ${m.title} (${m.textContent.length.toLocaleString()} chars)`
      )
    );

    const MAX_COMBINED_CHARS = 1500;
    let combinedText = materials.map((m) => m.textContent).join("\n\n");

    if (combinedText.length > MAX_COMBINED_CHARS) {
      combinedText = combinedText.slice(0, MAX_COMBINED_CHARS);
      console.log(
        `    Combined text truncated to ${MAX_COMBINED_CHARS} chars`
      );
    }

    const qType = questionType || "multiple_choice";
    const diff = difficulty || "medium";
    const qty = Math.max(parseInt(quantity) || 10, 1);

    console.log(`   Type: ${qType} | Difficulty: ${diff} | Quantity: ${qty}`);

    const prompt = buildQuizPrompt({
      studyText: combinedText,
      questionType: qType,
      difficulty: diff,
      quantity: qty,
    });

    const rawResponse = await generate(prompt);

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
      })
    );

    // Store the first material ID as the primary reference
    const quiz = new Quiz({
      materialId: materials[0]._id,
      config: { questionType: qType, difficulty: diff, quantity: qty },
      questions: numberedQuestions,
    });

    await quiz.save();

    console.log(
      `   Quiz saved to MongoDB: ${quiz._id} (${numberedQuestions.length} questions)`
    );

    res.json({
      success: true,
      quizId: quiz._id,
      materialId: materials[0]._id,
      materialIds: materials.map((m) => m._id),
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
export async function regenerateQuiz(req, res, next) {
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
export async function getQuizById(req, res, next) {
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
export async function getQuizzesByMaterial(req, res, next) {
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
export async function listAllQuizzes(_req, res, next) {
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
export async function ollamaHealth(_req, res) {
  const health = await checkHealth();
  res.json({ success: true, ollama: health });
}