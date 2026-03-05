// ──────────────────────────────────────────────────────────────
// Quiz Model — MongoDB Schema
// ──────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    id: Number,
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "multiple_choice",
    },
    options: [String],
    correct_answer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    config: {
      questionType: {
        type: String,
        default: "multiple_choice",
      },
      difficulty: {
        type: String,
        default: "medium",
      },
      quantity: {
        type: Number,
        default: 10,
      },
    },
    questions: [questionSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fetching quizzes by material
quizSchema.index({ materialId: 1 });
quizSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Quiz", quizSchema);
