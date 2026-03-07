import mongoose from "mongoose";

const ViewSchema = new mongoose.Schema(
  {
    simple: { type: String, default: "" },
    analogy: { type: String, default: "" },
    code: { type: String, default: "" },
    summary: { type: String, default: "" },
  },
  { _id: false },
);

const ExplanationSchema = new mongoose.Schema(
  {
    // ✅ owner of this explanation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    question: { type: String, required: true, trim: true },
    title: { type: String, required: true },

    mode: {
      type: String,
      enum: ["simple", "analogy", "code", "summary"],
      default: "simple",
    },

    instruction: String,

    answer: { type: String, required: true },

    views: {
      type: ViewSchema,
      required: true,
      default: () => ({}),
    },

    strict: { type: Boolean, default: false },

    // optional metadata
    module: { type: String, default: "ALL" },
    complexity: { type: Number, default: 55 },
  },
  { timestamps: true },
);

export default mongoose.model("Explanation", ExplanationSchema);
