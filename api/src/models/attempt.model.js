// Attempt Model — MongoDB Schema
const mongoose = require("mongoose");

const attemptAnswerSchema = new mongoose.Schema(
  {
    questionId: Number,
    questionText: String,
    type: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    explanation: {
      type: String,
      default: "",
    },
    feedback: String,
  },
  { _id: false },
  );

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    answers: [attemptAnswerSchema],
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    incorrectCount: Number,
    score: {
      type: Number,
      required: true,
    },
    grade: String,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
  );

// Index for fetching attempts by quiz and user
attemptSchema.index({ quizId: 1 });
attemptSchema.index({ userId: 1 });
attemptSchema.index({ submittedAt: -1 });

module.exports = mongoose.model("Attempt", attemptSchema);
