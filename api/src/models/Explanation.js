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
    question: { type: String, required: true, trim: true },
    title: { type: String, required: true },

    // user-selected mode at generation time (for default display)
    mode: {
      type: String,
      enum: ["simple", "analogy", "code", "summary"],
      default: "simple",
    },

    instruction: String,

    // backward compatibility (current frontend still uses answer)
    answer: { type: String, required: true },

    // ✅ NEW: store all explanation views together
    views: {
      type: ViewSchema,
      required: true,
      default: () => ({}),
    },

    // optional metadata
    strict: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Explanation", ExplanationSchema);
