import mongoose from "mongoose";

const ExplanationSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    title: { type: String, required: true },
    mode: {
      type: String,
      enum: ["simple", "analogy", "code", "summary"],
      default: "simple",
    },
    instruction: String,
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Explanation", ExplanationSchema);
