// ──────────────────────────────────────────────────────────────
// Answer Controller  — MongoDB Atlas Version
// Handles quiz submission, scoring, and feedback
// ──────────────────────────────────────────────────────────────
const Quiz = require("../models/quiz.model");
const Attempt = require("../models/attempt.model");

/**
 * POST /api/answers/submit
 * Body: { quizId, answers: [{ questionId, userAnswer }], userId? }
 *
 * Returns scored results with per-question feedback.
 */
async function submitAnswers(req, res, next) {
  try {
    const { quizId, answers, userId } = req.body;

    if (!quizId) {
      return res
        .status(400)
        .json({ success: false, error: "quizId is required" });
    }
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "answers array is required and must not be empty",
      });
    }

    // Fetch quiz from MongoDB
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    // ── Score each answer ──────────────────────────────────
    const results = [];
    let correctCount = 0;

    for (const ans of answers) {
      const question = quiz.questions.find(
        (q) => q.id === ans.questionId || q.id === parseInt(ans.questionId),
      );

      if (!question) {
        results.push({
          questionId: ans.questionId,
          error: "Question not found in quiz",
        });
        continue;
      }

      const isCorrect = checkAnswer(question, ans.userAnswer);
      if (isCorrect) correctCount++;

      results.push({
        questionId: question.id,
        questionText: question.question,
        type: question.type,
        userAnswer: ans.userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation || "",
        feedback: isCorrect
          ? "✅ Correct! Well done."
          : `❌ Incorrect. The correct answer is: ${question.correct_answer}`,
      });
    }

    const totalQuestions = answers.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const grade = getGrade(score);

    // ── Save attempt to MongoDB ──────────────────────────
    const attempt = new Attempt({
      userId: req.user?._id || userId || null,
      quizId: quiz._id,
      answers: results.filter((r) => !r.error), // Only save valid answers
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      score,
      grade,
    });

    await attempt.save();
    console.log(
      `  ✅ Attempt saved to MongoDB: ${attempt._id} (Score: ${score}%)`,
    );

    res.json({
      success: true,
      resultId: attempt._id,
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      score,
      grade,
      results,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/answers/results/:quizId
 * Get all attempts/results for a given quiz.
 */
async function getResults(req, res, next) {
  try {
    const attempts = await Attempt.find({ quizId: req.params.quizId })
      .populate("userId", "name email")
      .sort({ submittedAt: -1 })
      .lean();

    res.json({
      success: true,
      results: attempts.map((a) => ({
        id: a._id,
        quizId: a.quizId,
        user: a.userId,
        totalQuestions: a.totalQuestions,
        correctCount: a.correctCount,
        incorrectCount: a.incorrectCount,
        score: a.score,
        grade: a.grade,
        answers: a.answers,
        submittedAt: a.submittedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/attempts/:quizId
 * Alias — get student attempts for a quiz.
 */
async function getAttemptsByQuiz(req, res, next) {
  return getResults(req, res, next);
}

/**
 * GET /api/attempts/user/:userId
 * Get all attempts by a specific user.
 */
async function getAttemptsByUser(req, res, next) {
  try {
    const attempts = await Attempt.find({ userId: req.params.userId })
      .populate({
        path: "quizId",
        select: "config materialId createdAt",
        populate: { path: "materialId", select: "title" },
      })
      .sort({ submittedAt: -1 })
      .lean();

    res.json({
      success: true,
      attempts: attempts.map((a) => ({
        id: a._id,
        quiz: a.quizId,
        totalQuestions: a.totalQuestions,
        correctCount: a.correctCount,
        score: a.score,
        grade: a.grade,
        submittedAt: a.submittedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Compare the user's answer against the correct answer.
 * Handles multiple choice (letter matching), true/false, and short answer (fuzzy).
 */
function checkAnswer(question, userAnswer) {
  if (!userAnswer) return false;

  const correct = (question.correct_answer || "")
    .toString()
    .trim()
    .toLowerCase();
  const user = userAnswer.toString().trim().toLowerCase();

  switch (question.type) {
    case "multiple_choice": {
      // Match the option letter (A, B, C, D) or the full text
      const correctLetter = correct.charAt(0).toLowerCase();
      const userLetter = user.charAt(0).toLowerCase();

      if (correctLetter === userLetter) return true;
      return user === correct;
    }

    case "true_false":
      return user === correct;

    case "short_answer": {
      // Fuzzy matching: check if the core answer is present
      if (user === correct) return true;

      // Check if 60%+ of the words in the correct answer appear in the user answer
      const correctWords = correct.split(/\s+/).filter((w) => w.length > 3);
      if (correctWords.length === 0) return user === correct;

      const matchCount = correctWords.filter((w) => user.includes(w)).length;
      return matchCount / correctWords.length >= 0.6;
    }

    default:
      return user === correct;
  }
}

/**
 * Convert a numeric score to a letter grade.
 */
function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

module.exports = {
  submitAnswers,
  getResults,
  getAttemptsByQuiz,
  getAttemptsByUser,
};
