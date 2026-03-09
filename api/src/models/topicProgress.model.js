import mongoose from "mongoose";

const topicProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    masteryScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index: one progress record per user + topic
topicProgressSchema.index({ userId: 1, topic: 1 }, { unique: true });

export default mongoose.model("TopicProgress", topicProgressSchema);